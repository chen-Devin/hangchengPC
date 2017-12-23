/**
 * @version 1.4.2
 * @file 基础业务工具方法
 *      目前包括：
 *          封装Layui组件常用操作的 layui 模块，包含方法： initDateInput rerenderDateInput renderSelect rerenderDistrictCompoment loadDataToSelect relateDropDownToElement
 *          处理数据的 data 模块，包含方法： createFormDataByName setDataToContainer getValueByType
 *          控制iFrame的 frame 模块，包含方法： closeCurrentIframeTab refreshCurrentFrame refreshListFrame
 *          用于通用回调处理的 callback 模块，包含方法： closeLayerAndRefresh saveSuccessAndRefresh
 *          封装统一校验器操作的 validator 模块，包含方法： showElementVerifyError verifyContainer
 *          封装初始化操作的 init 模块，包含方法： initSelectData
 *      外部依赖：
 *          依赖 jQuery layui HC.js （没有依赖ES6语法）
 *          validator 模块 依赖 HCValidator.js
 */

// 业务工具方法
var bizUtil = (function () {
    // 对 Layui 组件常用操作的封装
    var layuiComponent = (function () {
        // 初始化日期组件（支持在html标签中 通过 data-* 属性 设置日期组件的 时间格式、日历类型、默认值、最小时间单位）
        var initDateInput = function (dateInput) {
            layui.use(['laydate'], function () {
                var laydate = layui.laydate;
                var timeValueMap = {
                    now: new Date()
                };
            
                // 若 直接在 laydate.render 中配置 elem 为 .date-time ，则除了第一个日历可以正常弹出，其它日历元素无法保持 日历面板打开。所以需要分开 单独初始化
                $(dateInput).each(function (i, item) {
                    var $_self = $(this);
                    var formatString = $_self.data('time_format') || 'yyyy-MM-dd HH:mm';
                    var dateType = $_self.data('time_type') || 'datetime';
                    var timeValue = timeValueMap[$_self.data('time_value')];
                    // 最小时间单位，默认为不限
                    var timeUnit = $_self.data('time_unit');
                    // 进行 最小时间单位 限制时，选择向上还是向下取整
                    var timeUnitNear = $_self.data('time_unit_near');
                    // 默认值（若输入框有值，则优先使用该值 而忽略 time_value 配置），强制转成数字格式，否则new Date()不支持类似"1507800000"的值
                    var inputValue = Number($_self.val());
                    // 最小时间（可以选择的最早时间），支持timeValueMap中定义的字符
                    var minTime = timeValueMap[$_self.data('time_min')] || $_self.data('time_min');
    
                    // 日期组件的渲染参数
                    var renderOptions = {
                        elem: this,
                        type: dateType,
                        format: formatString,
                        // timeValue 可以为 undefined，相当于没有传 value 属性
                        value: inputValue ? new Date(inputValue) : timeValue,
                        done: function(value, date, endDate) {
                            // 点击“清空”时，value为空，不处理
                            if (!value) {
                                return;
                            }
    
                            // 没有限制 最小时间单位 则不处理
                            if (timeUnit === undefined) {
                                return;
                            }
    
                            // 总的秒数（从 被选择时间 转换而来）
                            var totalSeconds = date.hours * 3600 + date.minutes * 60 + date.seconds;
    
                            // 限制 时分秒 最小选择单位（86400 = 60 * 60 * 24）。
                            if (timeUnit < 86400) {
                                // 刚好是 最小时间单位 的倍数时，不用做特殊处理
                                if ((totalSeconds % timeUnit) === 0) {
                                    return;
                                }

                                /*
                                 * “最小时间单位” 小于1天的算法：
                                 *  ①先通过 % 运算，去掉小于 “最小时间单位” 的那部分秒数，得到一个新的 “整除秒数”
                                 *  ②构造一个 “目标日期对象” ，并用 第①步的 “整除秒数” 来设置 相应的时分秒
                                 *  ③根据 “日期组件” 相应的 格式化规则 来将 “目标日期对象” 格式化 并得到 “目标时间字符串”
                                 *  ④将 “目标时间字符串” 设置回 “日期组件” 对应的 input 中，完成！
                                 */
                                var targetSeconds = totalSeconds - (totalSeconds % timeUnit);

                                var targetDate = new Date(value);
                                // 如果构建之后的日期对象是 无效日期，则重新使用带日期的时间 构建日期对象
                                if (!targetDate.getTime()) {
                                    // 临时实现，为了支持 缺日期的 格式化
                                    targetDate = new Date('2017-12-10 ' + value);
                                }
    
                                // 默认向上取整，除非显式设置 向下的取整方式
                                if (timeUnitNear !== 'down') {
                                    targetSeconds += timeUnit;
                                }
    
                                // Date对象的set方法会忽略小数部分（知识点：setHours可以传多个参数，顺序为 时、分、秒、毫秒）
                                targetDate.setHours(targetSeconds / 3600, (targetSeconds % 3600) / 60, (targetSeconds % 60));
                                
                                // 这里有坑： laydate 的自定义格式只支持HH 不支持hh，而Date.prototype.format格式化方法则仅支持hh不支持HH，所以在两者之间转换数据时要特别注意格式！！！
                                var targetTimeValue = targetDate.format(formatString.replace(/H/g, 'h'));
                                
                                // 太早设置 可能会被日期组件重置，所以需要放在 setTimeout 里延迟执行
                                setTimeout(function () {
                                    $_self.val(targetTimeValue);
    
                                    console.info('最小时间单位限制为[%s]秒，用户选择的时间是[%s]，已更新为[%s]', timeUnit, value, targetTimeValue);
                                }, 0);
                            }
                            // TODO: 支持最小选择单位为“周”等 else if (timeUnit == 86400 * 7)...
                        },
                    };
    
                    // 因为传入undefined型的min参数 会导致组件报错，所以这里单独判断（不直接写在 renderOptions 中了 ⊙﹏⊙）。有必要吐槽一下laydate这个低能货
                    if (minTime) {
                        // 限制最早可以选择的时间（注意，值不能为 数字及字符串 以外的格式）
                        renderOptions.min = ((typeof minTime === 'number') ? minTime : Number(new Date(minTime)));
                    }
                    
                    laydate.render(renderOptions);
                });
            });
        };
        
        // 重新渲染 laydate 日期组件
        var rerenderDateInput = function (container) {
            $(container).find('.date-time').each(function () {
                // 需要去掉 lay-key 属性，否则初始化后会与原有的日历事件冲突
                $(this).removeAttr('lay-key');
                initDateInput(this);
            });
        };

        // 初始化下拉框
        var renderSelect = function (options) {
            var settings = $.extend({
                // 保留 <option> 的个数
                retainOptionsLength: 1,
                dataList: [],
                // 渲染完成之后的回调函数
                afterRenderCallback: $.noop,
                // layui 的 form 模块
                layuiFormModule: layui.form
            }, options);
    
            var $_dropDownList = $(settings.element);
            var dataList = settings.dataList;
            
            // 创建原始的 <option> 元素
            HC.dom.select.createOptions($_dropDownList, dataList, settings.keyConvertMap, settings.retainOptionsLength);
            // 使用 layui 渲染
            settings.layuiFormModule.render('select', $_dropDownList.parent().attr('lay-filter'));
    
            // 保存数据源（方便后续 使用）
            $_dropDownList.data('dataList', dataList);
    
            // 执行回调
            settings.afterRenderCallback($_dropDownList, settings);
        };

        // 重新渲染 省市县组件（包括修改 新行中 省市县组件的id及lay-filter）
        var rerenderDistrictCompoment = function (layuiFormModule, container, logUtil) {
            logUtil = logUtil || console;
    
            $(container).find('.compoment-district').each(function () {
                logUtil.log('正在修改 省市县组件 的 id及lay-filter');
                
                var $_districtContainer = $(this);
                // 随机生成 新的组件id
                var districtCompomentId = String(Math.random()).replace('0.', 'district_');
    
                $_districtContainer.attr('id', districtCompomentId);
                // 还需要将 内部的 四个select的 lay-filter 改为 不重复的名称
                $_districtContainer.find('select').each(function () {
                    var $_self = $(this);
        
                    $_self.attr('lay-filter', $_self.attr('lay-filter') + '_' + districtCompomentId);
                });
    
                // 重新初始化 新行中的 省市县 组件（因为这个 district插件 只能使用 id选择器 初始化，所以将 初始化操作放在这个 each 中）
                $('#' + districtCompomentId).district(layuiFormModule, $_districtContainer.attr('district_value'));
    
                logUtil.info('id及lay-filter 修改完成，已重新初始化 id为 [%s] 的省市县组件', districtCompomentId);
            });
        };

        // 根据配置（<select>中的属性配置 或 单独传入的参数对象）自动为 <select> 加载动态数据，并美化为 layui 的 select组件
        var loadDataToSelect = (function () {
            // <select>中的 配置属性名
            var DATA_URL_ATTRNAME = 'hc-data_url';
            var ID_FIELD_ATTRNAME = 'hc-data_id_field';
            var TEXT_FIELD_ATTRNAME = 'hc-data_text_field';

            // 异步请求 deferred 对象 保存的data名
            var ajaxDeferredDataName = HC.constVariable.AJAX_DEFERRED_DATANAME;

            return function (select, options) {
                var $_select = $(select);
                var settings = $.extend({}, (options && options.defaultOptions), {
                    // layuiFormModule: undefined,
                    dataUrl: $_select.attr(DATA_URL_ATTRNAME),
                    idFieldName: $_select.attr(ID_FIELD_ATTRNAME),
                    textFieldName: $_select.attr(TEXT_FIELD_ATTRNAME),
                    ajaxDeferredDataName: ajaxDeferredDataName
                }, options);
        
                // 没有指定数据源，则不处理
                if (!settings.dataUrl) {
                    return;
                }
        
                // 字段转换处理（允许自定义id和name字段）
                var keyConvertMap = {};
                var idFieldName = settings.idFieldName;
                var textFieldName = settings.textFieldName;
                if (idFieldName) {
                    keyConvertMap[idFieldName] = HC.constVariable.SELECT_OPTION_FILED_NAME;
                }
                if (textFieldName) {
                    // 兼容 同一字段既转为id又转为name 的情况
                    if (textFieldName == idFieldName) {
                        // 这时需要以 数组形式 存放转换多次的值
                        keyConvertMap[textFieldName] = [HC.constVariable.SELECT_OPTION_FILED_NAME, HC.constVariable.SELECT_OPTION_TEXT_NAME];
                    }
                    else {
                        keyConvertMap[textFieldName] = HC.constVariable.SELECT_OPTION_TEXT_NAME;
                    }
                }
                
                console.info('正在为 select 元素自动加载数据', $_select, '\n自定义id和name字段', keyConvertMap);

                // TODO: 封装 Deferred对象与ajax结果处理 的逻辑
                var hcDeferred = $.Deferred(function (deferred) {
                    // 加载动态数据
                    HC.ajax.get(settings.dataUrl, {
                        // alert: false,
                        success: function (dataObjects, textStatus, jqXHR, responseJSON) {
                            var dataList = null;
        
                            // 容错 无数据的情况
                            if (!dataObjects) {
                                dataList = null;
                            }
                            // 列表数据有可能是 dataObjects （非page接口，一般为 search接口）
                            else if (dataObjects.length) {
                                dataList = dataObjects;
                            }
                            // 列表数据有可能是 dataObjects.list （page接口）
                            else if (dataObjects.list && dataObjects.list.length) {
                                dataList = dataObjects.list;
                            }
                            // 容错 无数据的情况
                            else {
                                dataList = null;
                            }
        
                            // TODO: 待 renderSelect 方法支持 beforeRenderCallback 之后 再处理无数据情况
                            // 根据动态数据 渲染 <select>
                            renderSelect({
                                layuiFormModule: settings.layuiFormModule,
                                element: $_select,
                                dataList: dataList,
                                keyConvertMap: keyConvertMap
                            });

                            // 成功时，传入与 success 方法相同的参数，保持一致性的调用习惯
                            deferred.resolve(dataObjects, textStatus, jqXHR, responseJSON);
                        },
                        codeError: function (responseJSON, textStatus, jqXHR) {
                            deferred.reject(responseJSON, textStatus, jqXHR);
                        },
                        error: function (jqXHR, textStatus, errorThrown) {
                            deferred.reject(jqXHR, textStatus, errorThrown);
                        }
                    });
                });

                // 将 Deferred对象 存到data中
                $_select.data(ajaxDeferredDataName, hcDeferred);

                return hcDeferred;
            };
        })();

        // 监听 layui的下拉框切换事件，并将 下拉框选中的value或text值 填充到指定元素
        var relateDropDownToElement = function (optionsList, layuiFormModule) {
            layuiFormModule = layuiFormModule || layui.form;
            var setSiblingElementValue = HC.dom.select.setSiblingElementValue;

            // optionsList 不是数组时，自动包裹为数组
            if (!$.isArray(optionsList)) {
                optionsList = [optionsList];
            }

            $.each(optionsList, function (i, options) {
                // 支持 元素为字符串的 optionsList（简化传参结构，相当于仅指定了 layFilter值的参数对象）
                if (typeof options == 'string') {
                    options = {
                        layFilter: options
                    };
                }

                // 监听layui下拉改变事件（注意：layui下拉框事件不支持 多次监听，每次都会覆盖已绑定的事件！使用时，务必注意）
                layuiFormModule.on('select(' + options.layFilter + ')', function(data) {
                    // 填充 相邻隐藏域的值
                    setSiblingElementValue(data.elem, options);
                });
            });
        };

        return {
            initDateInput: initDateInput,
            rerenderDateInput: rerenderDateInput,
            renderSelect: renderSelect,
            rerenderDistrictCompoment: rerenderDistrictCompoment,
            loadDataToSelect: loadDataToSelect,
            relateDropDownToElement: relateDropDownToElement
        };
    })();

    // 数据处理相关的方法
    var data = (function () {
        var FORM_FIELD_TYPE_ATTRNAME = 'hc-field_type';
        var FIELD_TYPE_NOTGET = 'ignoreGetter';

        // 格式转换工具
        var toTimestamp = HC.date.toTimestamp;
        var toJavaLong = HC.data.toJavaLong;

        // 根据类型获取 转换后的值
        var getValueByType = function (value, type) {
            var newValue = null;

            switch (type) {
                // 数字型
                case 'number': {
                    newValue = toJavaLong(value);
                    
                    break;
                }
                // 时间戳类型
                case 'timestamp': {
                    newValue = toTimestamp(value);

                    break;
                }
                // 仅包含时分（秒）的 时间类型，需要转为 正确的时间戳（86400000以内）
                case 'time': {
                    // 值为空时，则将其转为null（以区分 00:00 与 空值）
                    if (!value) {
                        newValue = null;
                        break;
                    }

                    // 添加 日期前缀，才能将 时分字符串转为 日期对象
                    var date = new Date('2017-12-10 ' + value);
                    // 86400e3 = 60 * 60 * 24 * 1000
                    newValue = Number(date) % 86400e3;

                    break;
                }
                // 更多类型，如 日期字符串、数字型的timestamp类型等
                // case 'boolean': {
                //     break;
                // }

                // 其它类型 原值返回
                default: {
                    newValue = value;

                    break;
                }
            }

            return newValue;
        };
        
        // TODO: 抽象 createFormDataByName 和 setDataToContainer 的通用逻辑
        return {
            getValueByType: getValueByType,

            // 根据容器内部 所有包含 name 属性 的表单域，创建一个 数据对象： { [name]: [value] }
            createFormDataByName: function (container, options) {
                var settings = $.extend({
                    districtCompomentSelector: '.compoment-district',
                    districtValueFieldName: 'addressAreaId',
                    districtTextFieldName: 'addressAreaText',
        
                    provinceSelector: 'select[name=province]',
                    citySelector: 'select[name=city]',
                    countrySelector: 'select[name=country]',
                    streetSelector: 'select[name=street]'
                }, options);
                var districtCompomentSelector = settings.districtCompomentSelector;
                var $_container = $(container);
        
                var formData = {};
        
                $_container.find('[name]').each(function () {
                    var $_field = $(this);
                    
                    // select型的表单域，且属于 省市县组件，则不再处理
                    if ($_field.is('select') && $_field.parents(districtCompomentSelector).length) {
                        return;
                    }
    
                    var fieldType = $_field.attr(FORM_FIELD_TYPE_ATTRNAME);
                    // 若指定 忽略属性，则不将其添加到 formData 中
                    if ((fieldType == FIELD_TYPE_NOTGET)) {
                        return;
                    }
                    
                    var fieldValue = $_field.val();
                    // 若指定 数据转换类型，则需要转换数据类型
                    if (fieldType) {
                        fieldValue = getValueByType(fieldValue, fieldType);
                    }
                    
                    formData[$_field.attr('name')] = fieldValue;
                });
        
                // 单独处理 省市县 组件
                var $_districtComponent = $_container.find(districtCompomentSelector);
                if ($_districtComponent.length) {
                    // 地区的值，依次从 街道、区县、城市、省份 中 获取（TODO: 去除 settings.streetSelector等的依赖）
                    var districtValue = $_container.find(settings.streetSelector).val() ||
                            $_container.find(settings.countrySelector).val() ||
                            $_container.find(settings.citySelector).val() ||
                            $_container.find(settings.provinceSelector).val();
                    var districtText = (function () {
                        var text = '';
        
                        $_districtComponent.find('.layui-select-title input').each(function () {
                            text += $(this).val()
                        });
        
                        return text;
                    })();
            
                    // 省市县 组件 在接口中用的字段名
                    var districtValueFieldName = $_districtComponent.data('district_value_field_name') || settings.districtValueFieldName;
                    var districtTextFieldName = $_districtComponent.data('district_text_field_name') || settings.districtTextFieldName;
        
                    // 将省市县的值写回 formData 中
                    formData[districtValueFieldName] = districtValue;
                    formData[districtTextFieldName] = districtText;
                }
        
                return formData;
            },
            // 将数据填充到容器的表单域中
            setDataToContainer: function (data, container, options) {
                var settings = $.extend({
                    // isInitComponent: true,
                    districtCompomentSelector: '.compoment-district',
                    districtFieldName: 'addressAreaId',
                    districtValueAttrName: 'district_value'
                    // 待支持下面的配置
                    // districtTextAttrName: 'district_text'
                }, options);
                var districtCompomentSelector = settings.districtCompomentSelector;
                var $_container = $(container);
        
                $_container.find('[name]').each(function () {
                    var $_field = $(this);
        
                    // select型的表单域，且属于 省市县组件，则不再处理
                    if ($_field.is('select') && $_field.parents(districtCompomentSelector).length) {
                        return;
                    }
        
                    var value = data[$_field.attr('name')];
        
                    // 忽略没有对应name的情况
                    if (value !== undefined) {
                        $_field.val((value || (value === 0)) ? value : '');
                    }
                });
                
                // 单独处理 省市县 组件
                var $_districtComponent = $_container.find(districtCompomentSelector);
                // 没有 省市县 组件就跳过
                if (!$_districtComponent.length) {
                    return;
                }
        
                // 省市县 组件 在接口中用的字段名
                var districtFieldName = $_districtComponent.data('district_value_field_name') || settings.districtFieldName;
        
                // 接口中的 省市县组件 字段 没值时，将全部 select 置空
                if (!data[districtFieldName]) {
                    $_districtComponent.find('select').val('');
        
                    return;
                }
        
                // 将省市县的值写回所在容器的属性中（暂不重写所有select元素的值）
                $_districtComponent.attr(settings.districtValueAttrName, data[districtFieldName]);
            }
        };
    })();

    // 控制 iFrame 的方法
    var frame = {
        // 关闭当前的iframe型Tab页
        closeCurrentIframeTab: function (tabWindowContent) {
            var iFrameId = $('.layui-tab-title li.layui-this', tabWindowContent.document).attr('lay-id');
    
            layui.tms_tab.del(iFrameId);
        },
        // 刷新当前iframe框架（用于当layer层关闭时，刷新 激活后的iframe框架）
        refreshCurrentFrame: function () {
            var iFrameId = $('.layui-this', window.parent.document).attr('lay-id');

            window.parent['f' + iFrameId].location.reload();
        },
        // 刷新列表所在iframe框架（用于当页面没关闭时，刷新列表页）
        refreshListFrame: function () {
            window.parent['f1'].location.reload();
        }
    };

    // 对一些通用回调方法的封装
    var callback = (function () {
        // 保存成功的通用操作：关闭所有弹窗 并刷新激活的iframe
        var closeLayerAndRefreshCurrentFrame = function (index, layero) {
            // 关闭 成功提示窗 及 内容编辑弹出窗
            parent.layer.closeAll();

            // 刷新当前iframe框架
            frame.refreshCurrentFrame();
        };

        // 通用的保存成功处理方式（弹出窗提示 “保存成功！”，点击确定后 关闭所有弹窗 并刷新激活的iframe）。
        // 该方法有两种调用方式： 1.作为普通的 ajax的success回调； 2.仅传入一个参数用于指定alertText，调用后会返回一个 与第一种调用方法相同的 function
        var saveSuccessAndRefresh = function () {
            // 创建成功提示
            var createSuccessAlert = function (alertText, args) {
                // 如果需要使用 dataObjects, textStatus, jqXHR 等参数，则可以从 args数组中 获取

                parent.layer.alert(alertText || '保存成功！', {
                    yes: closeLayerAndRefreshCurrentFrame
                });
            };

            // 如果参数只有一个，则说明 外部是以自定义alertText的方式调用，并不是给ajax的success回调，所以这里需要再包裹一层 function
            if (arguments.length === 1) {
                var alertText = arguments[0];

                return function () {
                    createSuccessAlert(alertText, arguments);
                };
            }
    
            // 正常情况下，saveSuccessAndRefresh是作为 ajax的success回调，所以这里使用默认的alertText，并将所有的 ajax的success回调参数 传入createSuccessAlert中
            createSuccessAlert(null, arguments);
        };

        return {
            closeLayerAndRefresh: closeLayerAndRefreshCurrentFrame,
            saveSuccessAndRefresh: saveSuccessAndRefresh
        };
    })();

    // 对 统一校验器的二次封装，方便 通用的校验失败处理
    var validator = (function () {
        // 显示 元素校验不通过 状态
        var showElementVerifyError = function (element, text) {
            // 如果有文本，就自动弹出提示
            if (text) {
                layer.msg(text);
            }
    
            var $_element = $(element);
            // 添加 外部红色框
            $_element.addClass('layui-form-danger');
            // 获得焦点
            $_element.focus();
        };

        // 对 HCValidator.verifyContainer 的二次封装，添加 默认的提示信息、元素焦点定位
        var verifyContainer = function (container) {
            var verifyResult = HCValidator.verifyContainer($(container));
            
            if (!verifyResult.isValidated) {
                console.log('统一规则校验【不通过】，校验提示文本：[%s]，校验不通过的元素为：', verifyResult.text, verifyResult.element, verifyResult);
    
                // 在界面上突出显示 校验不通过的元素
                showElementVerifyError(verifyResult.element, verifyResult.text);
            }
    
            return verifyResult.isValidated;
        }

        return {
            showElementVerifyError: showElementVerifyError,
            verifyContainer: verifyContainer
        };
    })();

    // 封装一些初始化操作
    var init = (function () {
        // 初始化 表单中 带 hc-data_url 属性的 <select> 元素
        var initSelectData = function (container, options, afterAjaxRequestCallback) {
            layui.use('form', function () {
                var layuiFormModule = layui.form;
                var hcDeferredList = [];
                
                $(container || 'form').find('select').each(function (i) {
                    var hcDeferred = layuiComponent.loadDataToSelect(this, $.extend({
                        layuiFormModule: layuiFormModule
                    }, options));

                    // loadDataToSelect 有可能不处理且没有返回 Deferred 对象
                    hcDeferred && hcDeferredList.push(hcDeferred);
                });

                // 回调参数是 Deferred对象数组，在外部可以用 $.when 的方式 监控所有异步数据获取的完成状态
                afterAjaxRequestCallback && afterAjaxRequestCallback(hcDeferredList);
            });
        };

        return {
            initSelectData: initSelectData
        };
    })();

    return {
        // Layui相关的组件处理方法
        layui: layuiComponent,

        // 数据处理方法
        data: data,

        // 控制 iFrame/Tab 的方法
        frame: frame,

        // 通用回调方法
        callback: callback,

        // 对 统一校验器的二次封装，方便 通用的校验失败处理
        validator: validator,

        // 封装一些初始化操作
        init: init
    };
})();