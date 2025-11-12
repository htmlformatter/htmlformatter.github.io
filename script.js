function copyCode(btn) {
    const pre = btn.parentElement;
    const code = pre.querySelector('code');
    const text = code.textContent;

    navigator.clipboard.writeText(text).then(() => {
        btn.textContent = 'Скопировано!';
        btn.classList.add('copied');

        setTimeout(() => {
            btn.textContent = 'Копировать';
            btn.classList.remove('copied');
        }, 2000);
    });
}
(function(m,e,t,r,i,k,a){
    m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
    m[i].l=1*new Date();
    k=e.createElement(t),a=e.getElementsByTagName(t)[0];
    k.async=1;k.src=r;a.parentNode.insertBefore(k,a)
})(window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

ym(97676462, "init", {
    id: 97676462,
    clickmap: true,
    trackLinks: true,
    accurateTrackBounce: true
});
document.addEventListener("DOMContentLoaded", () => {
    // ------------------------------
    // Общий CSS для плавного появления блоков
    // ------------------------------
    const style = document.createElement("style");
    style.textContent = `
        .yandex-ad-block {
            opacity: 0;
            transition: opacity 0.8s ease-in-out;
        }
        .yandex-ad-block.visible {
            opacity: 1;
        }
    `;
    document.head.appendChild(style);

    // Проверяем, начинается ли путь с /html-
    if (!window.location.pathname.startsWith("/html-")) return;

    const article = document.querySelector("article");

    // ------------------------------
    // 1. Рекламные блоки R-A-10604802-1 после абзацев внутри <article>
    // ------------------------------
    if (article) {
        const paragraphs = article.querySelectorAll("p");
        if (paragraphs.length > 0) {
            let adIndex = 1; // Нумерация блоков
            let insertAfter = 2; // Первый блок после 2-го абзаца

            for (let i = insertAfter - 1; i < paragraphs.length; i += 5) {
                const adDiv = document.createElement("div");
                adDiv.id = `yandex_rtb_R-A-10604802-1-${adIndex}`;
                adDiv.classList.add("yandex-ad-block");
                paragraphs[i].insertAdjacentElement("afterend", adDiv);

                if (window.yaContextCb && typeof window.yaContextCb.push === "function") {
                    window.yaContextCb.push(() => {
                        Ya.Context.AdvManager.render({
                            blockId: "R-A-10604802-1",
                            renderTo: adDiv.id
                        });
                        // Плавное появление блока
                        setTimeout(() => adDiv.classList.add("visible"), 50);
                    });
                }

                adIndex++;
            }
        }
    }

    // ------------------------------
    // 2. Рекламный блок R-A-10604802-3 (feed) после </article>
    // ------------------------------
    if (article) {
        const adDivFeed = document.createElement("div");
        adDivFeed.id = "yandex_rtb_R-A-10604802-3";
        adDivFeed.classList.add("yandex-ad-block");
        article.insertAdjacentElement("afterend", adDivFeed);

        if (window.yaContextCb && typeof window.yaContextCb.push === "function") {
            window.yaContextCb.push(() => {
                Ya.Context.AdvManager.render({
                    blockId: "R-A-10604802-3",
                    renderTo: adDivFeed.id,
                    type: "feed"
                });
                // Плавное появление блока
                setTimeout(() => adDivFeed.classList.add("visible"), 50);
            });
        }
    }
});
