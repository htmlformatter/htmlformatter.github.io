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

    // ------------------------------
    // 1. Рекламные блоки R-A-10604802-1 после абзацев
    // ------------------------------
    if (window.location.pathname.startsWith("/html-")) {
        const paragraphs = document.querySelectorAll("p");
        if (paragraphs.length > 0) {
            let adIndex = 1;
            let insertAfter = 2;

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
                        // Показываем блок с плавным переходом
                        setTimeout(() => adDiv.classList.add("visible"), 50);
                    });
                }

                adIndex++;
            }
        }
    }

    // ------------------------------
    // 2. Рекламный блок R-A-10604802-3 после </main>
    // ------------------------------
    const main = document.querySelector("main");
    if (main) {
        const adDivFeed = document.createElement("div");
        adDivFeed.id = "yandex_rtb_R-A-10604802-3";
        adDivFeed.classList.add("yandex-ad-block");
        main.insertAdjacentElement("afterend", adDivFeed);

        if (window.yaContextCb && typeof window.yaContextCb.push === "function") {
            window.yaContextCb.push(() => {
                Ya.Context.AdvManager.render({
                    blockId: "R-A-10604802-3",
                    renderTo: adDivFeed.id,
                    type: "feed"
                });
                setTimeout(() => adDivFeed.classList.add("visible"), 50);
            });
        }
    }
});
