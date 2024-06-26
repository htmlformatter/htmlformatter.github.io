importScripts("lib/polyfill.min.js");
importScripts("lib/prettier/standalone.js");
importScripts("lib/prettier/parser-html.min.js");
onmessage = function(event) {
    var text = event.data.text;
    var options = event.data.options;

    try {
        options.plugins = prettierPlugins;
        postMessage({
            formattedText: prettier.format(text, options)
        });

    } catch (e) {
        postMessage({
            error: {
                message: e.message
            }
        });
    }
};
