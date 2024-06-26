BaseClass=function(t){this.init(t)},BaseClass.extend=function(t){var n,o,e=function(){},i=this,s=t&&t.init?t.init:function(){i.apply(this,arguments)};for(n in e.prototype=i.prototype,o=s.fn=s.prototype=new e,t)null!=t[n]&&t[n].constructor===Object?o[n]=$.extend(!0,{},e.prototype[n],t[n]):o[n]=t[n];return o.constructor=s,s.extend=i.extend,s},BaseClass.rebindFunctionInstances=function(t){for(var n in t)$.isFunction(t[n])&&(t[n]=$.proxy(t[n],t)),null!=t[n]&&t[n].constructor===Object&&(t[n]=$.extend(!0,{},t[n]))},$.extend(BaseClass.prototype,{options:{},init:function(t){this.options=t}});

HtmlFormatter = BaseClass.extend({
    allowedFormats: ['html', 'htm', 'txt'],
    htmlHintsTimeout: undefined,
    hintTypes: {},
    options: {},
    worker: null,
    editor: null,
    isDisabledInterface: false,
    fileName: null,
    $el: {
        file: null,
        btnUpload: null,
        btnCopy: null,
        btnClear: null,
        btnDownload: null,
        btnLoadUrl: null,
        btnFormat: null,
        btnFormatLabel: null,
        btnFormatLoader: null,
        btnOptions: null,
        btnHintLeft: null,
        btnHintRight: null,

        formResize: null,

        optionsPanel: null,
        optionsInputTabSize: null,
        optionsInputPrintWidth: null,
        optionsModeTab: null,
        optionsModeSpace: null,
        optionsCheckboxAllHtml: null,
        optionsCheckboxJsHint: null,
        optionsCheckboxCssLint: null,

        modal: null,
        modalBackdrop: null,
        modalBtn: null,
        modalBtnClose: null,
        modalInput: null,
        modalErrorHint: null,
    },
    modalFormatChanged: false,
    formatButtonWasClicked: false,
    printWidth: 240,
    hints: [],
    tippyConfig: {
        duration: [null, 50],
        touch: false,
        delay: [1000, 100],
        maxWidth: 100,
        onShow: function(instance) {
            setTimeout(function() {
                instance.hide();
            }, 5000);
        }
    },

    init: function(options) {
        BaseClass.rebindFunctionInstances(this);
        $.extend(true, this.options, options ? options : {});

        this.__initElements();

        this.__initCookies();
        this.__initWorker();
        this.__initEditor();
        this.__initTooltips();
        this.__initNotification();
        this.__initEventHandlers();
    },

    __initNotification: function () {
        $.notify.addStyle('custom', {
            html: "<div>" +
                "<span class='title'>" + this.options.translate.notify.critical.title + "</span>" +
                "<span data-notify-text></span>" +
                "</div>"
        });
    },

    __initCookies: function () {
        try {
            var data = Cookies.get('s');
            if (data) {
                var settings = JSON.parse(data);
                var rules = settings.htmlRules;
                for (var i = 0; i < this.options.htmlHints.length; i++) {
                    var hint = this.options.htmlHints[i];
                    var isChecked = !!rules[hint.key];

                    $("#" + hint.key).prop('checked', isChecked);
                }

                this.$el.optionsCheckboxJsHint.prop('checked', !!rules.jshint);
                this.$el.optionsCheckboxCssLint.prop('checked', !!rules.csslint);
                this.$el.optionsCheckboxAllHtml.prop('checked', !!settings.htmlAll);
                this.$el.optionsInputTabSize.val(settings.tabSize);

                this.$el.optionsInputPrintWidth.val(settings.printWidth);
                if (settings.tabMode === 'tab') {
                    this.$el.optionsModeTab.prop('checked', true);
                } else {
                    this.$el.optionsModeSpace.prop('checked', true);
                }
            }
        } catch (e) {
            console.log(e)
        }

    },

    __initTooltips: function () {
        tippy(this.$el.btnHintLeft[0], $.extend({content: this.options.translate.tooltip.btnLeftHint,}, this.tippyConfig));
        tippy(this.$el.btnHintRight[0], $.extend({content: this.options.translate.tooltip.btnRightHint,}, this.tippyConfig));
        tippy(this.$el.hintPanel.find('.warning')[0], $.extend(this.tippyConfig, {
            maxWidth: 150,
            content: this.options.translate.tooltip.hintWarning }));
        tippy(this.$el.hintPanel.find('.error')[0], $.extend(this.tippyConfig, {
            maxWidth: 150,
            content: this.options.translate.tooltip.hintError }));
    },

    __initWorker: function() {
        this.worker = new Worker('js/worker.js?v2');
        this.worker.addEventListener('message', this._onWorkerFormatterPostMessage);
    },

    __initEditor: function() {
        ace.config.set('basePath', '/js/lib/ace/')
        this.editor = ace.edit('code', {
            mode: "ace/mode/html",
            theme: "ace/theme/chrome",
            fontSize: '14px',
            tabSize: 4, useSoftTabs: false,
            useWorker: false
        });
        this.editor.renderer.setShowGutter(false);
        this.editor.setShowPrintMargin(false);
        //this.editor.setAutoScrollEditorIntoView(true);
        this.editor.renderer.setScrollMargin(10, 10);

        // TODO the worker shoud be used. If the true the error messages are hidden
        // this.editor.getSession().setUseWorker(false);
        // todo remove
        // this.editor.setShowInvisibles(true);
        this.editor.on('change', this._onEditorChange);
        this.editor.on('focus', this._onEditorFocus);
        this.editor.on('blur', this._onEditorBlur);

        this.editor.commands.addCommand({
            name: 'left',
            bindKey: {win: 'Ctrl-Left',  mac: 'Command-Left'},
            exec: this.__showLastHint,
            readOnly: true
        });
        this.editor.commands.addCommand({
            name: 'up',
            bindKey: {win: 'Ctrl-Up',  mac: 'Command-Up'},
            exec: this.__showLastHint,
            readOnly: true
        });
        this.editor.commands.addCommand({
            name: 'right',
            bindKey: {win: 'Ctrl-Right',  mac: 'Command-Right'},
            exec: this.__showNextHint,
            readOnly: true
        });
        this.editor.commands.addCommand({
            name: 'down',
            bindKey: {win: 'Ctrl-Down',  mac: 'Command-Down'},
            exec: this.__showNextHint,
            readOnly: true
        });
    },

    editorHasBeenChanged: false,

    files: 0,
    __containsFiles: function (event) {
        if (event.originalEvent.dataTransfer.types) {
            for (var i = 0; i < event.originalEvent.dataTransfer.types.length; i++) {
                if (event.originalEvent.dataTransfer.types[i] === "Files") {
                    return true;
                }
            }
        }

        return false;
    },
    _onDragOverDropZone: function(e) {
        e.stopPropagation();
        e.preventDefault();
    },
    _onDragEnterDropZone: function(e) {
        if (this.__containsFiles(e)) {
            this.files++;
            this.$el.dragZone.show();
            this.$el.dragZone.addClass('dragged');
            if (this.editor.getValue().length > 0) {
                this.$el.btnClear.hide();
            }
            this.$el.dragZone.text(this.options.translate.drag.over);
            e.stopPropagation();
            e.preventDefault();
        }
    },
    _onDragLeaveDropZone: function(e) {
        if (this.files > 0) {
            this.files--;
        }

        if (this.files === 0) {
            this.$el.dragZone.text(this.options.translate.drag.default);
            this.$el.dragZone.removeClass('dragged');
            if (this.editor.getValue().length === 0) {
                this.$el.dragZone.show();
            } else {
                this.$el.dragZone.hide();
                this.$el.btnClear.show();
            }
        }

        e.stopPropagation();
        e.preventDefault();
    },
    _onDropDropZone: function(e) {
        this.$el.dragZone.text(this.options.translate.drag.default);
        this.$el.dragZone.removeClass('dragged');
        if (e.originalEvent.dataTransfer.files && e.originalEvent.dataTransfer.files.length > 0) {
            e.stopPropagation();
            e.preventDefault();
            this.__readFileData(e.originalEvent.dataTransfer.files[0]);

            if (this.editor.getValue().length === 0) {
                this.$el.dragZone.show();
            } else {
                this.$el.dragZone.hide();
                this.$el.btnClear.show();
            }
            this.files--;
        }
    },

    _onEditorFocus: function () {
        this.$el.dragZone.hide();
    },
    _onEditorBlur: function () {
        if (this.editor.getValue().length === 0) {
            this.$el.dragZone.show();
        }
    },
    _onEditorChange: function () {
        var text = this.editor.getValue();
        if (text.length > 0) {
            this.editor.renderer.setShowGutter(true);
            this.$el.btnClear.show();


            this.$el.dragZone.hide();

            if (!this.editorHasBeenChanged) {
                this.$el.btnCopy.removeClass('hidden');
                this.$el.btnDownload.removeClass('hidden');
            } else {
                this.$el.btnCopy.removeClass('disabled');
                this.$el.btnDownload.removeClass('disabled');
            }
        } else {
            this.editor.renderer.setShowGutter(false);
            this.$el.btnClear.hide();

            this.$el.btnCopy.addClass('disabled');
            this.$el.btnDownload.addClass('disabled');
        }

        if (this.formatButtonWasClicked) {
            clearTimeout(this.htmlHintsTimeout);
            this.htmlHintsTimeout = setTimeout(this.__updateHtmlHints, 300);
        }

        this.editorHasBeenChanged = true;
    },

    __showLastHint: function () {
        if(this.hints.length>0){
            var cursor = this.editor.selection.getCursor(),
                curRow = cursor.row,
                curColumn = cursor.column;
            var hint, hintRow, hintCol;
            for(var i=this.hints.length-1; i>=0; i--){
                hint = this.hints[i];
                hintRow = hint.row;
                hintCol = hint.column;
                if(hintRow < curRow || (hintRow === curRow && hintCol < curColumn)){
                    this.editor.moveCursorTo(hintRow, hintCol);
                    this.editor.renderer.scrollCursorIntoView({row: hintRow, column: hintCol}, 0.5)
                    this.editor.selection.clearSelection();

                    var lines = this.editor.session.getLength();

                    var position = (lines > 5 && lines - 5 < hintRow ? "top" : "bottom") + " left";
                    var context = this;
                    /*
                    setTimeout(function () {
                        $('.ace_cursor').notify(hint.text, {
                            style: 'custom',
                            // arrowShow: false,
                            className: context._getNotificationType(hint.type),
                            autoHideDelay: 15000,
                            position: position});
                    }, 100)
                     */
                    break;
                }
            }
        }
        return false;
    },

    _getNotificationType: function (hintType) {
        switch (hintType) {
            case 'warning': return 'warn';
            case 'error': return 'error';
            case 'info': return 'info';
        }
        return 'info';
    },

    __showNextHint: function () {
        if(this.hints.length>0){
            var cursor = this.editor.selection.getCursor(),
                curRow = cursor.row,
                curColumn = cursor.column;
            var hint, hintRow, hintCol;
            for(var i=0; i<this.hints.length; i++){
                hint = this.hints[i];
                hintRow = hint.row;
                hintCol = hint.column;
                if(hintRow > curRow || (hintRow === curRow && hintCol > curColumn)){
                    this.editor.moveCursorTo(hintRow, hintCol)
                    this.editor.selection.clearSelection();
                    this.editor.renderer.scrollCursorIntoView({row: hintRow, column: hintCol}, 0.5)
                    var lines = this.editor.session.getLength();
                    var position = (lines - 5 < hintRow ? "top" : "bottom") + " left";

                    var context = this;
                    /*
                    setTimeout(function () {
                        $('.ace_cursor').notify(hint.text, {
                            style: 'custom',
                            arrowShow: false,
                            className: context._getNotificationType(hint.type),
                            autoHideDelay: 15000,
                            elementPosition: position});
                    }, 100)
                     */
                    break;
                }
            }
        }
        return false;
    },

    __showHintsPanel: function () {
        var keys = Object.keys(this.hintTypes);
        var hasKeys = keys.length > 0 && this.editor.getValue().length > 0;
        var $warnings = this.$el.hintPanel.find('.warning');
        var $errors = this.$el.hintPanel.find('.error');
        var $comma = $errors.prev();

        if (hasKeys) {
            this.$el.hintPanel.show();
            var warnings = this.hintTypes['warning'];
            var errors = this.hintTypes['error'];

            if (warnings) {
                $warnings.show();
                $warnings.text(warnings);

            } else {
                $warnings.hide();
            }

            if (errors) {
                $errors.show()
                if (!warnings) {
                    $comma.hide();
                } else {
                    $comma.show()
                }
                $errors.text(errors);
            } else {
                $errors.hide();
                $comma.hide();
            }
        } else {
            this.$el.hintPanel.hide();
        }

    },

    __getHintRules: function () {
        var ruleSets = {};
        for(var i = 0; i < this.options.htmlHints.length; i++) {
            var tool = this.options.htmlHints[i];
            var key = tool['key'];
            if ($("#" + key).is(':checked')) {
                ruleSets[key] = true;
            }
        }

        ruleSets['space-tab-mixed-disabled'] = this.__getTabMode();

        if ($("#cssLint").is(":checked")) {
            ruleSets['csslint'] = {
                "display-property-grouping": true,
                "known-properties": true
            };
        }

        if ($("#jsHint").is(":checked")) {
            ruleSets['jshint'] = {};
        }

        return ruleSets;
    },

    __updateHtmlHints: function() {
        if (this.formatButtonWasClicked) {

            this.hintTypes = {};
            var ruleSets = this.__getHintRules();
            var text = this.editor.getValue();

            var messages = HTMLHint.HTMLHint.verify(text, ruleSets);
            var errors = [];

            for (var i = 0, l = messages.length; i < l; i++) {
                var message = messages[i];

                if (!this.hintTypes[message.type]) {
                    this.hintTypes[message.type] = 0
                }
                this.hintTypes[message.type]++;

                errors.push({
                    row: message.line - 1,
                    column: message.col - 1,
                    text: message.message,
                    type: message.type,
                    raw: message.raw
                });
            }

            this.hints = errors;
            this.editor.getSession().setAnnotations(errors);
            this.__showHintsPanel();
        }
    },

    __initElements: function() {

        this.$el.globalHints = $('#globalHints');
        this.$el.form = $('.form-body');
        this.$el.file = $("[type=file]");
        this.$el.btnUpload = $(".i-browse").parent();
        this.$el.btnClear = $(".form-body>.form__btn_cross");
        this.$el.btnDownload = $("#btnDownload");
        this.$el.btnFormat = $(".primary");
        this.$el.btnCopy = $(".i-copy").parent();
        this.$el.btnFormatLabel = this.$el.btnFormat.find('span');
        this.$el.btnFormatLoader = $(".spinner");
        this.$el.btnOptions = $(".form__btn.light");
        this.$el.btnHintLeft = $(".i-left").parent();
        this.$el.btnHintRight = $(".i-right").parent();
        this.$el.dragZone = $('.form-body__drag_zone');

        this.$el.editor = $('#code');
        this.$el.formResize = $('.form-body__resizer > div');

        this.$el.modal = $(".modal");
        this.$el.modalBackdrop = $('.modal-backdrop');
        this.$el.modalInput = this.$el.modal.find('.form__input > input');
        this.$el.modalErrorHint = this.$el.modal.find('.form__input-error');
        this.$el.modalBtn = this.$el.modal.find('.form__btn');
        this.$el.modalBtnClose = this.$el.modal.find('.modal-header > .form__btn_cross');

        this.$el.hintPanel = $('.form__hints');
        this.$el.optionsInputTabSize = $("#tabSize");
        this.$el.optionsPanel = $('.form-options__body');
        this.$el.optionsInputPrintWidth = $("#printWidth");
        this.$el.optionsModeTab = $('#mode_tab');
        this.$el.optionsModeSpace = $('#mode_space');
        this.$el.optionsCheckboxAllHtml = $('#allHtmlOptions');
        this.$el.optionsCheckboxJsHint = $('#jsHint');
        this.$el.optionsCheckboxCssLint = $('#cssLint');
    },

    __initEventHandlers: function() {

        var context = this;
        $('.form__btn')
            .on('mouseleave', function (e) {
                $(this).removeClass('focus');
            })
            .on('touchstart mousedown', function (e) {
                if (!$(this).hasClass('disabled')) {
                    $(this).addClass('focus');
                }
            })
            .on('touchend mouseup', function (e) {
                $(this).removeClass('focus');
            });

        this.$el.file.on("change", this.__fileUpload);
        this.$el.btnUpload.on("click", this._onUploadButtonClick);

        this.$el.btnClear.on("click", this._onClearEditorButtonClick);
        this.$el.btnFormat.on('click', this._onFormatButtonClick);
        this.$el.btnDownload.on("click", this._onDownloadButtonClick);
        this.$el.btnOptions.on("click", this._onButtonOptionsClick);
        this.$el.btnHintLeft.on('click', this.__showLastHint);
        this.$el.btnHintRight.on('click', this.__showNextHint);
        this.$el.formResize.on('mousedown touchstart', this._onResizerMouseDown);
        $(document).on('mousemove touchmove', this._onResizerMove);
        $(document).on('mouseup touchend', this._onDocumentMouseUp);

        this.$el.dragZone.on('click', this.__onDragZoneClick);


        this.$el.modalBtn.on("click", this._onModalButtonClick);
        this.$el.modal.unbind("keyup").bind('keyup', this._onModalKeyUp);
        this.$el.modalInput.on('keyup', this._onModalInputKeyUp);
        this.$el.modalBackdrop.on('click', this._onCloseButtonClick);
        this.$el.modalBtnClose.on('click', this._onCloseButtonClick);
        this.$el.modal.find('input[type=radio]').on('click', this._onFormatRadioClick);


        this.$el.optionsInputTabSize.on('keyup', this.__saveSettings);
        this.$el.optionsInputPrintWidth.on('keyup', this.__saveSettings);
        this.$el.optionsModeTab.on('click', this._onCheckBoxHtmlClick);
        this.$el.optionsModeSpace.on('click', this._onCheckBoxHtmlClick);
        this.$el.optionsCheckboxAllHtml.on('click', this._onAllHtmlOptionsClick);
        this.$el.optionsCheckboxJsHint.on('click', this._onCheckBoxHtmlClick);
        this.$el.optionsCheckboxCssLint.on('click', this._onCheckBoxHtmlClick);
        for(var i = 0; i < this.options.htmlHints.length; i++) {
            var item = this.options.htmlHints[i];
            var $checkboxHtmlHint = $('#' + item.key);
            $checkboxHtmlHint.on('click', this._onCheckBoxHtmlClick)
        }

        new ClipboardJS(this.$el.btnCopy[0],
            {
                text: function() {return context.editor.getValue();}
            })
            .on('success', function () {
                context.__showSuccessNotification(context.options.translate.notify.btn.copy)});

        var $document = $(document);
        $document.on('dragenter', this._onDragEnterDropZone);
        $document.on('dragover', this._onDragOverDropZone);
        $document.on('dragleave', this._onDragLeaveDropZone);
        $document.on('drop', this._onDropDropZone);


    },

    __onDragZoneClick: function () {
        this.editor.focus();
    },

    _onFormatRadioClick: function (e) {
        this.modalFormatChanged = true;
    },

    _onResizerMouseDown: function (e) {
        e.preventDefault();
        this.resizeTop = this.$el.editor.offset().top;
    },
    _onResizerMove: function (e) {
        if (this.resizeTop) {
            var y = e.pageY;
            if (e.originalEvent.touches && e.originalEvent.touches.length > 0) {
                var touch = e.originalEvent.touches[0]
                y = touch.pageY;
            }

            var height = y - this.resizeTop;
            if (height > 300) {
                this.$el.form.css('height', height);
            }

            e.preventDefault();
        }
    },
    _onDocumentMouseUp: function (e) {
        if (this.resizeTop) {
            this.resizeTop = null;
            this.editor.resize();
            e.preventDefault();
        }
    },

    __getPrintWidth: function () {
        return Number(this.$el.optionsInputPrintWidth.val());
    },

    __getTabMode: function () {
        return this.$el.optionsModeTab.is(":checked") ? 'tab' : 'space';
    },

    __saveSettings: function () {
        var settings = {
            htmlRules: this.__getHintRules(),
            tabSize: this.__getTabSize(),
            printWidth: this.__getPrintWidth(),
            tabMode: this.__getTabMode(),
            htmlAll: this.__isHtmlAllChecked()
        };
        Cookies.set('s', JSON.stringify(settings), 365);
    },

    __isHtmlAllChecked: function () {
        return this.$el.optionsCheckboxAllHtml.is(':checked');
    },

    _onAllHtmlOptionsClick: function (e) {
        var isAllOptionsChecked = this.__isHtmlAllChecked();

        for(var i = 0; i < this.options.htmlHints.length; i++) {
            var item = this.options.htmlHints[i];
            var $item = $('#' + item.key);
            $item.prop('checked', isAllOptionsChecked);
        }

        this.__updateHtmlHints();
        this.__saveSettings();
    },

    _onCheckBoxHtmlClick: function () {
        this.__updateHtmlHints();
        this.__saveSettings();
    },

    _onButtonOptionsClick: function () {
        if (this.$el.optionsPanel.is(':hidden')) {
            this.$el.optionsPanel.addClass('open')
            this.$el.btnOptions.addClass('selected');
            this.$el.btnOptions.find('.icon').removeClass('i-expand').addClass('i-expand-up');
        } else {
            this.$el.btnOptions.removeClass('selected');
            this.$el.btnOptions.find('.icon').removeClass('i-expand-up').addClass('i-expand');
            this.$el.optionsPanel.removeClass('open');
        }
    },

    _onCloseButtonClick: function() {
        this.$el.modal.removeClass('show');
        this.$el.modal.css('left', -100000);
        this.$el.modalErrorHint.css('visibility', 'hidden');
        this.$el.modalInput.val('');
    },

    _onUploadButtonClick: function () {
        this.$el.file.trigger("click");
    },

    _onModalInputKeyUp: function (e) {
        const fileName = this.$el.modalInput.val();
        if (fileName.match(/[\*?:<>"|\/\\]+/g) || fileName.length === '') {
            this.$el.modalErrorHint.css('visibility', 'visible')
            this.$el.modalBtn.addClass('disabled');
        } else {
            this.$el.modalErrorHint.css('visibility', 'hidden');
            this.$el.modalBtn.removeClass('disabled');
        }
    },

    _onModalKeyUp: function(e) {
        if (e.code === 'Enter') {
            this._onModalButtonClick();
            return false;
        }

        if (e.code === 'Escape') {
            this._onCloseButtonClick();
            return false;
        }
    },

    _onModalButtonClick: function() {
        var fileName = this.$el.modalInput.val();
        var isDisabled = this.$el.modalBtn.hasClass('disabled');
        if (!isDisabled) {
            this.__downloadFile(fileName);
            this._onCloseButtonClick();
        }
    },

    _onDownloadButtonClick: function(e) {
        if (this.$el.btnDownload.hasClass('disabled')) {
            return
        }
        if (this.fileName) {
            this.$el.modalInput.val(this.fileName);
        }
        this.$el.modal.data('type', 'download');
        this.__showModal();
        e.preventDefault();
    },

    __showModal: function() {
        this.$el.modal.addClass('show')
        this.$el.modal.css('left', 0);
        if (!this.modalFormatChanged) {
            switch (this.fileFormat) {
                case "txt":
                    $('#formatTxt').prop('checked', true);
                    break;
                case "htm":
                    $('#formatHtm').prop('checked', true);
                    break;
                case "html":
                    $('#formatHtml').prop('checked', true);
                    break;

            }
        }
    },

    _onClearEditorButtonClick: function() {
        this.editor.setValue('');
        this.editor.session.setValue('');
        this.$el.file[0].value = '';
        this.fileName = '';

        this.$el.dragZone.show();
    },

    __fileUpload: function() {
        var input = this.$el.file[0];
        var file = input.files[0];
        if (file) {
            this.__readFileData(file);
        }
    },

    __readFileData: function(file) {
        var fileName = file.name;
        var matches = fileName.match(/\.([a-zA-Z0-9]+)$/)
        this.fileFormat = 'html';
        this.modalFormatChanged = false;
        if (matches && matches.length > 0) {

            var format = matches[1]
            if (this.allowedFormats.indexOf(format) === -1) {
                this.__showErrorNotification(this.options.translate.notify.format.error);
                return;
            }

            this.fileFormat = format;
            this.fileName = fileName.replace(/\.[a-zA-Z0-9]+$/, '');

        } else {
            this.fileName = fileName;
        }
        var fileReader = new FileReader();
        var context = this;
        fileReader.onload = function () {
            context.editor.setValue(fileReader.result);
            context.$el.file.val('');
            context.formatButtonWasClicked = false;
            context.hintTypes = {};
            context.$el.hintPanel.hide();
        };

        fileReader.readAsText(file);
    },
    __showNotification: function(message, type, autoHideDelay) {
        this.$el.globalHints.notify(message,
            {
                style: 'custom',
                // autoHide: false,
                arrowShow: false,
                className: type,
                autoHideDelay: autoHideDelay ? autoHideDelay : 2000,
                position: "left top"
            });
    },
    __showSuccessNotification: function (message, autoHideDelay) {
        this.__showNotification(message, 'success', autoHideDelay);
    },
    __showErrorNotification: function (message, autoHideDelay) {
        this.__showNotification(message, 'error', autoHideDelay);
    },

    _onFormatButtonClick: function () {
        var text = this.editor.getValue();
        var tabWidth = this.__getTabSize();

        if (text.length === 0)
        {
            this.__showErrorNotification(this.options.translate.notify.format.empty)
            return;
        }

        if (isNaN(tabWidth)) {
            this.__showErrorNotification(this.options.translate.notify.format.error_tabs_empty);
            return;
        }

        var options = {
            printWidth: this.__getPrintWidth(),
            tabWidth: tabWidth,
            useTabs: this.__getTabMode() === 'tab',
            parser: 'html'
        };
        this.editor.setOption("tabSize", tabWidth);

        this.__disableInterface();
        this.worker.postMessage({text: text, options: options});
    },
    _onWorkerFormatterPostMessage: function (event) {
        var context = this;

        var formattedText = event.data.formattedText;
        if (formattedText) {
            this.editor.setValue(formattedText);
        }

        if (event.data.error) {

            var position = this.__getCursorPositionFromError(event.data.error);
            this.editor.moveCursorTo(position.line, position.ch);
            this.editor.scrollToLine(position.line, true, true);
            this.editor.selection.clearSelection();

            var isPositionFree = true;
            if (this.formatButtonWasClicked) {
                for (var i = 0; i < this.hints.length; i++) {
                    var hint = this.hints[i];
                    if (hint.row === position.line && hint.column === position.ch && hint.type === 'error') {
                        isPositionFree = false;
                        break;
                    }
                }
            } else {
                this.hints = [];
            }

            if (isPositionFree) {
                this.hints.push({
                    row: position.line,
                    column: position.ch ,
                    text: event.data.error.message,
                    type: 'error',
                    raw: ''
                });
            }

            this.editor.getSession().setAnnotations(this.hints);
        } else {
            this.formatButtonWasClicked = true;
            this.__updateHtmlHints();
        }


        setTimeout(function()  {
            context.__enableInterface();
            context.editor.focus();
        }, 300);
    },

    __getCursorPositionFromError: function(e) {
        if (e.message.indexOf("Parse Error") !== -1) {
            var line = e.message.split("\n")[0].match( /\d+/);
            return {line: parseInt(line) - 2, charNumber: null};
        }

        const errorElements = e.message.split('\n');
        var line = errorElements[0];
        const match = /([0-9]+):([0-9]+)/g.exec(line);
        if (match && match.length === 3) {
            const lineNumber = match[1] - 1;
            const charNumber = parseInt(match[2]) - 1;
            return {line: lineNumber, ch: charNumber};
        }
        return null;
    },

    __disableInterface: function() {
        this.$el.btnFormat.addClass("disabled");
        this.$el.btnFormatLoader.width(this.$el.btnFormatLabel.width());
        this.$el.btnFormatLabel.hide();
        this.$el.btnFormatLoader.show();
        this.isDisabledInterface = true;
    },

    __enableInterface: function() {
        this.$el.btnFormat.removeClass("disabled");
        this.$el.btnFormatLabel.show();
        this.$el.btnFormatLoader.hide();
        this.isDisabledInterface = false;
    },

    __downloadFile: function(fileName) {
        var text = this.editor.getValue();
        var fileFormat = $('input[name=fileFormat]:checked').val();
        var mimeType = this.__getMimeType(fileFormat);
        if (!fileName) {
            fileName = window.location.hostname.replace(/\.[a-zA-Z]+$/, '');
        }

        fileName = fileName + "." + fileFormat;

        try {
            var b = new Blob([text],{type: mimeType});
            saveAs(b, fileName);
        } catch (e) {
            window.open("data:" + mimeType + "," + encodeURIComponent(text));
        }
    },

    __getMimeType: function (format) {
        switch (format) {
            case "html": return "text/html";
            case "txt" : return "plain/text";
        }
    },

    __getTabSize: function () {
        return parseInt(this.$el.optionsInputTabSize.val());
    }
});