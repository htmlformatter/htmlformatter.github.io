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
