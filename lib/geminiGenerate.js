import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_MODELS } from "@/lib/gemini";

const RETRYABLE = /503|429|overloaded|unavailable|resource exhausted|deadline/i;
const NOT_FOUND = /404|not found|no longer/i;
const DAILY_QUOTA = /per day|per_day|GenerateRequestsPerDay|quota exceeded for metric/i;

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function withTimeout(promise, ms) {
  if (!ms || ms <= 0) {
    return promise;
  }
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error("TIMEOUT")), ms);
    }),
  ]);
}

function mapGeminiError(lastError) {
  let message = "Не получилось получить ответ. Попробуйте ещё раз.";
  if (/API[_ ]?key|permission|401|403/i.test(lastError)) {
    message = "Ключ Gemini отклонён. Проверьте GEMINI_API_KEY в Google AI Studio.";
  } else if (DAILY_QUOTA.test(lastError)) {
    message =
      "Дневной лимит бесплатного Gemini исчерпан. Подождите до завтра или включите биллинг в Google AI Studio.";
  } else if (/503|overloaded|unavailable|429|resource exhausted/i.test(lastError)) {
    message =
      "Gemini перегружен или слишком много запросов. Подождите минуту и повторите (без лишних вкладок).";
  } else if (NOT_FOUND.test(lastError)) {
    message = "Модель Gemini недоступна. Обновите приложение или ключ API.";
  }
  return message;
}

export { mapGeminiError };

/**
 * Сначала лёгкие модели, при 503 — одна пауза и повтор, без долгого перебора.
 */
export async function generateGeminiText(apiKey, prompt, options = {}) {
  const {
    temperature = 0.8,
    maxOutputTokens = 4096,
    models = GEMINI_MODELS,
    attemptsPerModel = 2,
    attemptTimeoutMs = 25000,
    deadlineMs = 50000,
  } = options;
  const genAI = new GoogleGenerativeAI(apiKey);
  let lastError = "Не удалось связаться с Gemini.";
  const started = Date.now();

  for (const modelName of models) {
    for (let attempt = 0; attempt < attemptsPerModel; attempt += 1) {
      if (deadlineMs > 0 && Date.now() - started > deadlineMs) {
        lastError = "TIMEOUT";
        break;
      }
      if (attempt > 0) {
        await sleep(1200);
      }
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            temperature,
            responseMimeType: "application/json",
            maxOutputTokens,
          },
        });
        const result = await withTimeout(
          model.generateContent(prompt),
          attemptTimeoutMs
        );
        const text = result.response.text();
        if (text?.trim()) {
          return text;
        }
        lastError = "Пустой ответ модели";
      } catch (error) {
        lastError = error?.message || lastError;
        if (DAILY_QUOTA.test(lastError)) {
          break;
        }
        if (NOT_FOUND.test(lastError)) {
          break;
        }
        if (lastError === "TIMEOUT") {
          continue;
        }
        if (!RETRYABLE.test(lastError)) {
          break;
        }
      }
    }
    if (DAILY_QUOTA.test(lastError)) {
      break;
    }
  }

  const err = new Error(mapGeminiError(lastError));
  err.cause = lastError;
  throw err;
}
