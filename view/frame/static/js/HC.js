/**
 * @version 1.4
 * @file 底层工具库代码
 *      目前包括：
 *          常用工具类方法模块 util data date ajax dom
 *          二次封装的 Layui 组件模块 tips upload
 *          用于整体配置的常量模块 constVariable
 *          为了方便一些没有引入 layui 的页面 使用`layui.data`方法的 HC.layuiData 方法
 *          用于比较数据对象是否相等的 DataComparer 类
 *      外部依赖：
 *          工具类方法只依赖 jQuery （没有依赖ES6语法）
 *          HC.dom.createFileItem 方法的显示结果 依赖 Layui 样式
 *          HC.ajax 、 HC.tips 模块依赖 layer 模块
 *          HC.upload 方法 依赖 Layui.upload （该方法也支持由外部传入 Layui.upload 模块，所以也可以看作弱依赖的模块）
 */
var HC = (function (HC) {
    // 常量模块
    var constVariable = {
        HC_TABLE_NAME: 'hc',
        VALIDATION_KEY_NAME: 'validationData',
        SELECT_OPTION_FILED_NAME: 'id',
        SELECT_OPTION_TEXT_NAME: 'name',
        // 异步请求 deferred 对象 保存在元素中的data名
        AJAX_DEFERRED_DATANAME: 'ajaxDeferred',
        FILE_NAME_SEPARATOR: '#&',
        DOWNLOAD_URL: '/ucenter/download/%fileName.shtml',
        LOGIN_URL: '/',
        AJAX_SUCCESS_CODE: 'SUCCESS',
        USER_LOGOFF_CODE: 'ERROR_USER_LOGOFF',
        SYSTEM_BUSY_TEXT: '系统繁忙，请稍后重试！'
    };
    // 对象包含 单一工具方法
    var util = {
        argumentsToList: function (args) {
            return Array.prototype.slice.call(args);
        },
        getDownloadFileUrl: function (serverFileName, downloadUrl) {
            return (downloadUrl || constVariable.DOWNLOAD_URL).replace('%fileName', serverFileName);
        }
    };
    // 对象包含 日期类处理方法
    var date = {
        toTimestamp: function (dateSource) {
            var timestamp = dateSource ? Number(new Date(dateSource)) : '';

            // 转成字符串（这样才能支持 空值）
            timestamp = String(timestamp);

            return timestamp;
        }
    };

    // 对象包含 数据处理类方法
    var data = (function () {
        // 转换列表数据（将 列表中的元素的一些属性，转换为另一些属性）
        var convertList = function (dataList, keyConvertMap) {
            // 遍历列表数据
            $.each(dataList, function (i, dataItem) {
                // 根据 键值转换对象，为 列表数据的元素 添加 新属性
                $.map(keyConvertMap, function (newKey, selfKey) {
                    var newValue = dataItem[selfKey];

                    // 支持数组的情况（将一个属性的值，赋给多个属性）
                    if ($.isArray(newKey)) {
                        $.each(newKey, function (i, newKeyItem) {
                            dataItem[newKeyItem] = newValue;
                        });
                    }
                    // 普通字符串情况
                    else {
                        dataItem[newKey] = newValue;
                    }
                });
            });

            return dataList;
        };

        // 打印对象（支持数组）的指定属性
        var logPropertyName = function (propertyNameList, iterativeObject, logFlagString) {
            // 根据 propertyNameList 将对象转成数组形式
            var objectToList = function (object) {
                var list = [];

                propertyNameList.forEach((propertyName, i) => {
                    list.push({
                        '属性名': propertyName,
                        // 区分 有属性名的undefined值 和 没有该属性名的undefined值
                        '它的值': ((propertyName in object) ? object[propertyName] : '--- 没有该属性 ---')
                    });
                });

                return list;
            };

            try {
                // 空数据对象提醒
                if (!iterativeObject) {
                    console.warn('【%s】 数据对象为空', logFlagString);
                    return;
                }

                // 支持数组，可以一次性打印多个对象
                if ($.isArray(iterativeObject)) {
                    // 空数组提醒
                    if (!iterativeObject.length) {
                        console.warn('【%s】 数组暂无数据', logFlagString);
                        return;
                    }

                    $.each(iterativeObject, function (i, dataItem) {
                        console.table(objectToList(dataItem));
                        console.log('上面是第 %s 组的 【%s】\n', (i + 1), logFlagString);
                    });
                }
                else {
                    console.table(objectToList(iterativeObject));
                    console.log('上面是 【%s】\n', logFlagString);
                }
                
            } catch (error) {
                console.error(error);
            }
        };

        // 内部 原子方法，该功能会被封装为高级的多态方法
        var _toJavaLong = function (value) {
            return value ? Number(value) : null;
        };
        // 转换数字型数据（字符串转为数字、空值转为null）
        var toJavaLong = function (dataObject, propertyName) {
            // 如果没有传对象，则直接返回 转换后的属性值（兼容 v1.1.3 版本之前的用法）
            if (!dataObject) {
                return _toJavaLong(propertyName);
            }

            // 仅传入一个参数时，直接将参数转为数字型并返回
            if (arguments.length === 1) {
                return _toJavaLong(arguments[0]);
            }

            // 将指定的属性名的值 转为 后端Long能接收的值
            dataObject[propertyName] = _toJavaLong(dataObject[propertyName]);

            // 返回操作对象，支持链式调用
            return dataObject;
        };

        return {
            convertList: convertList,
            toJavaLong: toJavaLong,
            logPropertyName: logPropertyName
        };
    })();

    // 对象包含 DOM相关的方法
    var dom = (function () {
        // 创建 <select> 的 <option> 元素
        var createOptions = function (selectElement, dataList, keyConvertMap, retainOptionsLength) {
            var $_select = $(selectElement);

            // 默认替换 <select> 原有的 <option> 元素，除非显式指定 retainOptionsLength 为数字（负数表示保留所有 option，正数表示 仅保留指定数量的options）
            if (!$.isNumeric(retainOptionsLength)) {
                $_select.empty();
            }
            // 保留 retainOptionsLength 个 option：比如 retainOptionsLength 为 3，则 保留前3个option，其它的option将会被删除
            else if (retainOptionsLength >= 0) {
                $_select.children().slice(retainOptionsLength).remove();
            }

            // 根据 dataList 创建 <option> 列表（若有keyConvertMap参数，则用data.convertList方法预处理一遍dataList）
            var optionList = $.map(keyConvertMap ? data.convertList(dataList, keyConvertMap) : dataList, function (item, i) {
                return [
                    '<option value="', item[constVariable.SELECT_OPTION_FILED_NAME], '">',
                        item[constVariable.SELECT_OPTION_TEXT_NAME],
                    '</option>'
                ].join('');
            });

            // console.log(dataList, optionList);
            $_select.append(optionList);
        };
        // 与 createOptions 功能相同，但不替换 <select> 原有的 <option> 元素
        var appendOptions = function (selectElement, dataList, keyConvertMap) {
            return createOptions(selectElement, dataList, keyConvertMap, -1);
        };
        // 设置 相邻元素的值（该值为 下拉框选中的value或text值）
        var setSiblingElementValue = function (select, options) {
            var $_select = $(select);
            var selectValue = $_select.val();
            var relateValue = '';
            options = options || {};

            // 支持从select的text和value取值
            switch (options.relateField) {
                case 'value': {
                    relateValue = selectValue;

                    break;
                }
                // 默认为 text 方式
                case 'text':
                default: {
                    // 如果 selectValue 为空，则也使用空值
                    relateValue = selectValue ? $_select.find(':checked').text() : '';

                    break;
                }
            }

            // 若指定关联元素，则填充 指定的关联元素值
            if (options.relateElement) {
                options.relateElement.val(relateValue);
            }
            // 若指定了 关联相邻元素的name，则将值填充到 该name所属的元素
            else if (options.relateSiblingName) {
                $_select.siblings('[name=' + options.relateSiblingName + ']').val(relateValue);
            }
            // 默认会赋值给相邻的隐藏域
            else {
                $_select.siblings('input[type=hidden]').val(relateValue);
            }
        };

        // 创建 文件项 的方法
        var createFileItem = function (fileName, serverFileName) {
            // 正常调用，必须要有 fileName ，没有则不处理
            if (!fileName) {
                return;
            }

            var fileItemHTML = [
                '<div class="file-item"', (serverFileName ? (' server_file_name="' + serverFileName + '"') : ''), '>',
                    '<span>',
                        '<i class="layui-icon icon-file">&#xe60a;</i>',
                    '</span>',
                    '<a target="_blank" class="file-name" ', (serverFileName ? ('href="' + util.getDownloadFileUrl(serverFileName) + '"') : ''), '>',
                        // TODO: 对文件名进行过滤（去掉html标签及实体符）
                        fileName,
                    '</a>',
                    '<span class="icon-delete" title="删除文件"></span>',
                    '<span class="status-icon-group">',
                        '<i class="layui-icon layui-anim layui-anim-rotate layui-anim-loop icon-loading" title="文件上传中...">&#xe63d;</i>',
                        '<i class="icon-warn" title="文件上传失败">!</i>',
                    '</span>',
                '</div>'
            ].join('');

            return $(fileItemHTML);
        };

        // 使用淡出效果 删除元素
        var fadeOutRemove = function (element, options) {
            // 若有必要，则支持 fadeOut 参数（参考jQuery源码 处理三种传参方式）
            var settings = $.extend({
                callback: $.noop,
                selector: undefined
            }, options);

            $(element).fadeOut(function () {
                // 将返回的删除元素 作为回调的参数
                settings.callback.call(this, $(this).remove(settings.selector));
            });
        };

        // 根据模版元素，返回 指定数量的复制元素（集合）
        var clone = function (cloneElement, number/* , cloneOptions */) {
            if (!cloneElement || !number) {
                return null;
            }

            var $_cloneTemplate = $(cloneElement);
            var cloneElementArray = [];

            for (var i = 0; i < number; i++) {
                // 必须把dom元素放在数组里，最后构造出来的jQuery对象 调用after等方法时才不会报错
                cloneElementArray.push($_cloneTemplate.clone()[0]);
            }

            return $(cloneElementArray);
        };

        return {
            select: {
                createOptions: createOptions,
                appendOptions: appendOptions,
                setSiblingElementValue: setSiblingElementValue
            },
            createFileItem: createFileItem,
            fadeOutRemove: fadeOutRemove,
            clone: clone
        };
    })();


    // 二次封装的 ajax 对象，对外提供 baseAjax、get、post、put、byDelete 方法，每个方法的使用方式 均与 $.ajax 相同
    var ajax = (function () {
        // 错误代码集
        var ERROR_CODE_MAP = $.extend({
            ERROR: '操作失败：未知异常'
        }, window.ERROR_CODE_MAP);
        var myAjax = {};

        // 获取 类ajax 方法的options参数（会兼容 不带URL的单参数 与 加了URL的双参数）
        var getAjaxOptions = function (url, options) {
            if (typeof url === 'object') {
                options = url;
                url = undefined;
            }
            else {
                options.url = url;
            }
    
            return options || {};
        };

        // 默认的错误提示方法
        var defaultErrorAlert = function (errorMessage, callback) {
            var options = {
                // 默认的 winodw 引用为 当前页面
                windowContext: 'self',
                errorMessage: (errorMessage !== undefined) ? errorMessage : '',
                // （针对异步方式的弹窗）默认 在弹窗销毁时，也会执行callback（因为有时 layer的弹层会被其它弹层销毁掉）
                isDestroyCallback: true
            };

            // 支持 参数对象类型的 errorMessage
            if (typeof errorMessage === 'object') {
                // 合并参数
                $.extend(options, errorMessage);
            }

            // 指定的window对象，如果没有值，则默认使用 本页面的 window对象
            var targetWindow = window[options.windowContext] || window;

            // 如果指定的 window 对象没有 layer，则使用本页面所在 window 对象的 layer
            var targetLayer = targetWindow.layer || window.layer;

            // 如果页面有引入 layer ，则使用 layer.alert 方式弹窗，否则 使用浏览器自带的 alert
            if (targetLayer && targetLayer.alert) {
                targetLayer.alert(options.errorMessage, {
                    // 弹窗关闭后，根据 参数中的isDestroyCallback 决定是否调用 callback
                    end: (options.isDestroyCallback ?  callback : undefined),

                    // 不显示右上角关闭按钮
                    closeBtn: 0
                }, callback);
            }
            else {
                targetWindow.alert(options.errorMessage);
                callback();
            }
        };
        // 依次从 错误代码集合、响应信息字段、默认错误信息 中获取 错误提示信息
        var getErrorMessage = function (responseJSON) {
            return ERROR_CODE_MAP[responseJSON.code] || responseJSON.msg || constVariable.SYSTEM_BUSY_TEXT;
        };
        // 构建 错误提示参数
        var createErrorAlertOptions = function (errorMessage, alertOptions) {
            return $.extend({
                errorMessage: getErrorMessage(errorMessage)
            }, alertOptions);
        };
        // 登录超时的处理逻辑
        var doLogoff = function () {
            window.top.location.href = constVariable.LOGIN_URL;
        };

        // 对 ajax 进行二次封装的主体实现。相比 $.ajax ，额外支持 options.codeError、options.alert 方法（可以很灵活地自定义异常处理）。并且对登录超时做了自动处理，对其它异常自动进行提示
        var baseAjax = function (url, options) {
            options = getAjaxOptions(url, options);

            // 业务规定的默认值，都可以写在这里
            var ajaxOptions = $.extend({
                dataType: 'json'
            }, options);

            // 保存原参数的 success 引用
            var originalSuccessCallback = options.success || $.noop;

            // 默认对 success 进行通用业务处理
            ajaxOptions.success = function (responseJSON, textStatus, jqXHR) {
                var responseCode = responseJSON.code;
                // 可以通过 options.alert 自定义 错误提示方式
                var errorAlert = options.alert || defaultErrorAlert;

                // 先处理通用异常
                if (responseCode === constVariable.USER_LOGOFF_CODE) {
                    var logoffAlertOptions = createErrorAlertOptions(responseJSON, options.alertOptions);

                    // 通过判断 提示回调 的参数长度，区分 同步/异步 弹窗
                    if (errorAlert.length >= 2) {
                        // 异步方式的弹窗，则将 默认跳转行为 放在回调方法中（所以在 options.alert 方法内可以通过不执行此 此回调 来阻止默认行为）
                        errorAlert(logoffAlertOptions, doLogoff);
                    }
                    else {
                        // 同步方式的弹窗，可以在 options.alert 执行后返回 false 来阻止登录会话过期时 跳转到登录页面 的默认行为
                        if (errorAlert(logoffAlertOptions) !== false) {
                            doLogoff();
                        }
                    }

                    // 发生异常 则不执行后续流程
                    return;
                }

                // 根据 code 判断 此次请求是否返回正常数据
                if (responseCode !== constVariable.AJAX_SUCCESS_CODE) {
                    console.warn('ajax 数据请求完成，但响应数据异常，业务状态码 [%s] ，提示信息 [%s]' , responseCode, responseJSON.msg);

                    // 构建 错误提示参数 TODO: 支持外部自定义扩展 ERROR_CODE_MAP
                    var errorAlertOptions = createErrorAlertOptions(responseJSON, options.alertOptions);

                    // 没有设置业务错误处理回调 options.codeError ，或者该回调没有返回 false ，则会自动调用错误提示方法
                    if (!options.codeError || (options.codeError.call(this, responseJSON, textStatus, jqXHR) !== false)) {
                        // 提供 快捷取消默认错误提示 的设置（将 options.alert 设置为 false，则不会出现默认提示）
                        if (options.alert !== false) {
                            errorAlert(errorAlertOptions);
                        }
                    }

                    return;
                }

                // 业务数据正常返回下，再调用原来的success方法（第一个参数改为 响应数据的objects属性，完整的响应数据由第四个参数传递）
                originalSuccessCallback.call(this, (responseJSON.objects || {}), textStatus, jqXHR, responseJSON);
            };

            // TODO: ajaxOptions.error 默认实现（提示网络异常 或 系统繁忙）

            // console.log('ajaxOptions', ajaxOptions);

            return $.ajax(ajaxOptions);
        };
        myAjax.baseAjax = baseAjax;

        // get 方法需要单独加 `cache: false` 选项
        myAjax.get = function (url, options) {
            return baseAjax($.extend({
                cache: false,
                method: 'get'
            }, getAjaxOptions(url, options)));
        };

        // 为 post、put、delete 方法 提供快捷方式
        $.each(['post', 'put', 'delete'], function (i, method) {
            myAjax[method] = function (url, options) {
                var ajaxSettings = $.extend({
                    method: method,
                    // 非 GET 类型的请求，发送数据时 使用JSON格式
                    contentType: 'application/json'
                }, getAjaxOptions(url, options));

                // 如果发送的数据是对象，则自动转成 JSON 格式
                if ($.isPlainObject(ajaxSettings.data)) {
                    ajaxSettings.data = JSON.stringify(ajaxSettings.data);
                }

                return baseAjax(ajaxSettings);
            };
        });
        // 因为 delete 是关键字，所以给方法取别名，方便外部使用 '.' 运算符进行调用
        myAjax.byDelete = myAjax['delete'];

        /**
         * @method baseAjax 对 $.ajax 进行二次封装的主体实现，支持 与 $.ajax 一致的调用方式和参数设置。
         *              内置逻辑处理：
         *                  对登录超时做了自动处理，对其它异常自动进行提示。
         *                  请求成功后，将响应数据转为 json 格式，并将其中的 objects 数据结果 传给 success 方法。
         * @param {string|Object} url 与 $.ajax 的第一个参数用法相同：若参数为字符串类型，则当作请求地址。若为参数为对象类型，则当作 options 参数处理
         * @param {Object} options 与 $.ajax 的第二个参数用法相同，额外支持以下几个配置项
         * @param {function} options.codeError 业务错误时（响应数据的code不为'SUCCESS'）会调用的方法。当该回调返回 false 时，可以阻止默认的错误处理逻辑
         * @param {function} options.alert 自定义异常处理方法，用于替换 默认的错误处理逻辑。 TODO: 该属性名不要局限在 alert 上，而是要表现出 可以提供自定义异常处理逻辑。
         *              当该方法可以提供同步（参数列表只定义一个参数）或异步（参数列表有至少两个参数）回调方式：
         *                  使用同步方式，若该方法没有返回false。则登录超时后 会自动跳转到登录页面。
         *                  对于异步方式，则跳转登录页面的方法会作为回调方法的第二个参数传入，由外部决定是否调用第二个参数来决定 是否跳转至登录页面。
         *              应用场景：有些错误并不想打扰到用户（比如自动完成的提示列表、登录失败可能要把信息显示在输入框下面），就需要使用自定义异常处理方法。
         * @param {Object} options.alertOptions 用于设置 默认错误处理弹窗属性 的参数
         * @param {string=self} options.alertOptions.windowContext 设置弹窗所属的window对象（默认值是self，可选的有效值为 parent/top ）
         * @param {string} options.alertOptions.errorMessage 优先级最高的错误提示信息。该属性的值 可以覆盖 错误码对应的文本值
         * @param {boolean=true} options.alertOptions.isDestroyCallback 由于默认的layer.alert弹窗 可能会被其它弹层销毁掉，所以可以用该字段指定 在弹窗销毁时，是否执行 callback 回调。
         *              应用场景：若不希望 登录超时的自动跳转功能 被后续的弹层覆盖后 马上触发，可以设置此值为 false（不建议，但有些特定的场景确实需要）
         */
        return myAjax;
    })();


    // 二次封装 layer.tips 方法
    var tips = (function () {
        var TIPS_WARN_BG = '#FF5722';
        var TIPS_INFO_BG = '#FFB800';

        // 警告类信息
        var warn = function (text, element, time, options) {
            var settings = $.extend({
                tips: [3, TIPS_WARN_BG],
                time: time
            }, options);

            return layer.tips(text, element, settings);
        };
        // 提示类信息
        var info = function (text, element, time, options) {
            return warn(text, element, time, $.extend({tips: [3, TIPS_INFO_BG]}, options));
        };

        return {
            warn: warn,
            info: info
        };
    })();

    // 二次封装 layui.upload.render 方法
    var upload = (function () {
        // extendOptions 可以添加额外的 layui.upload.render 同名回调方法： before done error
        return function (layuiUploadOptions, extendOptions) {
            // 缓存变量
            var layuiUpload = extendOptions.layuiUpload;
            var alertMessage = extendOptions.alert || (window.layer && layer.alert) || alert;
            var $_fileItemContainer = $(extendOptions.fileItemContainer);
            var createFileItem = extendOptions.createFileItem || dom.createFileItem;
            var loadingStatusClassName = extendOptions.loadingStatusClassName || 'file-item--loading';
            var failStatusClassName = extendOptions.failStatusClassName || 'file-item--fail';
            var downLinkSelector = extendOptions.downLinkSelector || '.file-name';
            var downloadUrl = extendOptions.downloadUrl || constVariable.DOWNLOAD_URL;
            var saveAttrName = extendOptions.saveAttrName || 'server_file_name';
            var _itemDataNamePrefix = 'fileItem-';

            // （上传完成）根据 index 找到对应的 fileItem 元素
            var getFileItemByIndex = function (index) {
                return $_fileItemContainer.data(_itemDataNamePrefix + index);
            };

            // layui.upload.render 的参数
            var renderOptions = $.extend({
                // 上传接口
                url: '/ucenter/upload.shtml',
                
                // 多文件上传
                // multiple: true,
                // 允许上传的文件类型 images（默认）、file、video、audio
                // accept: 'file',
                // 最大文件大小限制（单位kb，默认不限制）
                // size: 1024,

                // 在所有回调函数中，this 均指向 本配置对象（即 传给 upload.render 的参数）

                // 文件提交上传前的回调
                before: function (uploadObject) {
                    // console.log('before', uploadObject);

                    // uploadObject 包含三个方法： preview 、 pushFile 、 upload
                    // uploadObject.preview 调用时接受一个回调方法，回调方法有三个参数： index 、 fileInfo 、 fileData

                    uploadObject.preview(function(index, fileInfo, fileData) {
                        // fileInfo 中包含两个有用信息： name 、 size
                        // console.log('before preview', index, fileInfo, fileData);

                        // 触发外部扩展回调
                        extendOptions.onBeforeCreateFileItem && extendOptions.onBeforeCreateFileItem(index, fileInfo, fileData, uploadObject);

                        // 创建文件项
                        var $_fileItem = createFileItem(fileInfo.name);
                        // 添加 状态类
                        $_fileItem.addClass(loadingStatusClassName);
                        // 插入DOM中
                        $_fileItemContainer.append($_fileItem);
                        // 保存引用（以 index 为标识）
                        $_fileItemContainer.data(_itemDataNamePrefix + index, $_fileItem);

                        // 触发外部扩展回调
                        extendOptions.onAfterCreateFileItem && extendOptions.onAfterCreateFileItem($_fileItem, $_fileItemContainer, uploadObject);
                    });

                    // 触发外部扩展回调（千万注意，当文件正在上传，然后再次点击打开文件选择框 则取消选择文件后会多触发一次 before 事件！！！仅多触发一次！！！）
                    extendOptions.before && extendOptions.before(uploadObject);
                },
                // 上传完毕回调
                done: function (responseJSON, index, upload) {
                    // console.log('done', responseJSON, index, upload);

                    var $_fileItem = getFileItemByIndex(index);
                    // 移除 loading 状态类
                    $_fileItem.removeClass(loadingStatusClassName);

                    // 响应数据异常
                    if (responseJSON.code !== constVariable.AJAX_SUCCESS_CODE) {
                        // TODO: 使用 HC.ajax 的通用处理

                        var uploadFailMessage = responseJSON.msg;
                        alertMessage(uploadFailMessage);
                        
                        // 添加 异常状态类
                        $_fileItem.addClass(failStatusClassName);
                        // 重置异常信息
                        $_fileItem.find(".icon-warn").attr('title', uploadFailMessage);

                        // 触发外部扩展回调
                        extendOptions.notDone && extendOptions.notDone(responseJSON, index, upload);

                        return;
                    }

                    // 服务器文件名
                    var serverFileName = responseJSON.objects;
                    // 添加 下载链接
                    $_fileItem.find(downLinkSelector).attr('href', util.getDownloadFileUrl(serverFileName, downloadUrl));
                    // 保存 服务器文件名
                    $_fileItem.attr(saveAttrName, serverFileName);

                    // 触发外部扩展回调
                    extendOptions.done && extendOptions.done(responseJSON, index, upload);
                },
                // 请求异常回调
                error: function (index, upload) {
                    // console.log('error', index, upload);
                    
                    var $_fileItem = getFileItemByIndex(index);
                    // 移除 loading 状态类
                    $_fileItem.removeClass(loadingStatusClassName);

                    // 添加 异常状态类
                    $_fileItem.addClass(failStatusClassName);

                    // 触发外部扩展回调
                    extendOptions.error && extendOptions.error(index, upload);
                }

                // 多文件上传完毕后的状态回调（只选择一个文件时，也会触发此回调）
                // allDone: function (uploadInfo) {
                //     // uploadInfo 对象包含三个属性： aborted 、 successful 、 total
                //     console.log('allDone', uploadInfo);
                // }

            }, layuiUploadOptions);

            // 初始化上传组件
            var init = function (layuiUpload) {
                return layuiUpload.render(renderOptions);
            };

            // 如果有传 layui.upload 模块，则直接使用该模块 执行初始化方法
            if (layuiUpload) {
                init(layuiUpload);
            }
            // 如果没有 layui.upload 模块，则异步加载模块后 再执行初始化方法
            else {
                layui.use('upload', function () {
                    init(layui.upload);
                });
            }
        };
    })();

    // 方便一些没有引入 layui 的页面使用 layui.data 方法
    var layuiData = (function () {
        if ((typeof layui !== 'undefined') && layui.data) {
            return layui.data;
        }

        // 以下并不优雅的实现来自 Layui.prototype.data v2.2.3 https://github.com/sentsin/layui/blob/master/src/layui.js
        return function (table, settings) {
            table = table || 'layui';
            
            if(!JSON || !JSON.parse) return;
            
            //如果settings为null，则删除表
            if(settings === null){
              return delete localStorage[table];
            }
            
            settings = typeof settings === 'object' 
              ? settings 
            : {key: settings};
            
            try{
              var data = JSON.parse(localStorage[table]);
            } catch(e){
              var data = {};
            }
            
            if('value' in settings) data[settings.key] = settings.value;
            if(settings.remove) delete data[settings.key];
            localStorage[table] = JSON.stringify(data);
            
            return settings.key ? data[settings.key] : data;
        };
    })();

    // 数据比较 类
    var DataComparer = function (originalData, compareDataGetter) {
        // 为兼容没有 bind 方法的浏览器，这里不直接使用 fn.bind ，改用 替换 this 变量的方式
        var dataComparer = this;

        // 设置 获取待比较数据 的方法。参数： 数据获取方法、传给 数据获取方法的固定参数（如需传递多个参数，则以数组的形式组合）
        var setCompareDataGetter = function (compareDataGetter, args) {
            // 多加一层 function 是为了支持 给 compareDataGetter 方法传递 外部指定的 args 参数
            dataComparer._compareDataGetter = function () {
                // 使用 [].concat 确保 传递给 apply方法的第二个参数始终是数组
                return compareDataGetter ? compareDataGetter.apply(dataComparer, [].concat(args)) : $.noop;
            };
        };

        // 初始化
        dataComparer.originalData = originalData;
        if (compareDataGetter) {
            setCompareDataGetter(compareDataGetter);
        }

        this.setOriginalData = function (originalData) {
            dataComparer.originalData = originalData;
        };

        // 设置 获取待比较数据 的方法
        this.setCompareDataGetter = setCompareDataGetter;

        // 与原始数据进行比较，相等 返回 true，不相等 返回 false
        this.isEqualOriginalData = function (compareData) {
            // 简单使用 JSON序列化后的字符串来比较。 TODO: 将两个数据对象的属性按顺序排列后，再一一对比（有属性顺序，就不需要双向对比）
            return JSON.stringify(dataComparer.originalData) == JSON.stringify(compareData);
        };

        // 判断原始数据是否发生变化
        this.isOriginalDataChange = function () {
            if (!dataComparer._compareDataGetter) {
                console.warn('没有设置 获取待比较数据 的方法！ isOriginalDataChange 方法始终返回 false');
                return false;
            }

            // 自动调用 _compareDataGetter 方法 获取数据
            var compareData = dataComparer._compareDataGetter();

            // 再返回 isEqualOriginalData 方法的调用结果
            return !dataComparer.isEqualOriginalData(compareData);
        };
    };

    return $.extend({}, HC, {
        constVariable: constVariable,
        util: util,
        data: data,
        date: date,
        ajax: ajax,
        dom: dom,
        tips: tips,
        upload: upload,
        layuiData: layuiData,
        DataComparer: DataComparer
    });
})(HC);