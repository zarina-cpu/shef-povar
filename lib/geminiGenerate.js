import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_MODELS } from "@/lib/gemini";

const RETRYABLE = /503|429|overloaded|unavailable|resource exhausted|deadline/i;
const NOT_FOUND = /404|not found|no longer/i;

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function mapGeminiError(lastError) {
  let message = "Не получилось получить ответ. Попробуйте ещё раз.";
  if (/API[_ ]?key|permission|401|403/i.test(lastError)) {
    message = "Ключ Gemini отклонён. Проверьте GEMINI_API_KEY в Google AI Studio.";
  } else if (/503|overloaded|unavailable|429|resource exhausted/i.test(lastError)) {
    message =
      "Gemini перегружен или лимит запросов. Закройте лишние вкладки с сайтом, подождите минуту и повторите.";
  } else if (NOT_FOUND.test(lastError)) {
    message = "Модель Gemini недоступна. Обновите приложение или ключ API.";
  }
  return message;
}

export { mapGeminiError };

/**
 * Сначала лёгкие модели, при 503 — пауза и повтор, без перебора всех подряд без задержки.
 */
export async function generateGeminiText(apiKey, prompt, options = {}) {
  const { temperature = 0.8, maxOutputTokens = 4096 } = options;
  const genAI = new GoogleGenerativeAI(apiKey);
  let lastError = "Не удалось связаться с Gemini.";

  for (const modelName of GEMINI_MODELS) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      if (attempt > 0) {
        await sleep(1800);
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
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        if (text?.trim()) {
          return text;
        }
        lastError = "Пустой ответ модели";
      } catch (error) {
        lastError = error?.message || lastError;
        if (NOT_FOUND.test(lastError)) {
          break;
        }
        if (!RETRYABLE.test(lastError)) {
          break;
        }
      }
    }
  }

  const err = new Error(mapGeminiError(lastError));
  err.cause = lastError;
  throw err;
}
