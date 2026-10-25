export const metadata = {
  title: "Сброс cookies — Шеф",
};

export default function ResetCookiesPage() {
  return (
    <main className="app" style={{ maxWidth: "36rem", margin: "0 auto" }}>
      <article className="panel">
        <h1 style={{ marginTop: 0 }}>Ошибка 494 на телефоне</h1>
        <p>
          Браузер отправляет слишком большие cookies для этого сайта. Так бывает после старой
          версии с фото в сессии. Сайт не может загрузиться, пока cookies не удалены.
        </p>
        <h2>Android (Chrome)</h2>
        <ol>
          <li>Откройте значок замка или «i» слева от адреса (если страница хоть раз открылась).</li>
          <li>
            Или: <strong>Настройки Chrome → Сайты → Все сайты → shef-povar.vercel.app → Очистить
            и сбросить</strong>.
          </li>
          <li>Либо откройте сайт в <strong>режиме инкognito</strong> — там cookies пустые.</li>
        </ol>
        <p>
          После очистки зайдите снова на{" "}
          <a href="https://shef-povar.vercel.app/">shef-povar.vercel.app</a> и войдите в аккаунт.
          Фото профиля подгрузится отдельно, cookie останется маленькой.
        </p>
      </article>
    </main>
  );
}
