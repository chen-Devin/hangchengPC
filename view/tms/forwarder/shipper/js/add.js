// 示例代码
// layui.use(['form', 'layer'], function () {
//     var form = layui.form;
//     var layer = layui.layer;

//     //自定义验证规则
//     form.verify({

//     });


//     if ($type == 'edit') {
//         //todo
//     }
// });


// 主功能执行入口
layui.use(['layer', 'form', 'element', 'upload'], function() {
    var pageAction = $.trim(getUrlParam('do'));
    var orderId = $.trim(getUrlParam('id'));
    // 编辑状态 参数校验
    if ((pageAction == 'edit') && !orderId) {
        parent.layer.alert('没有订单id参数！', {
            yes: function () {
                parent.layer.closeAll();
            }
        });

        return;
    }

    var layer = layui.layer;
    var layuiFormModule = layui.form;
    var layuiUploadModule = layui.upload;

    var newFlowManager = orderCommon.newFlowManager;
    var dataLoader = orderCommon.dataLoader;
    var shippingEvent = orderCommon.shippingEvent;

    // 删除项的data名前缀
    var DELETE_TYPE_PREFIX_DATANAME = 'delete_type_';
    // 文件项的data名
    var FILE_ID_DATANAME = 'fileId';

    var $_myForm = $('#myForm');

    // 初始化默认数据
    var initDefaultData = function () {
    };
    // 初始化组件
    var initComponent = function () {
        // 初始化页面中的日期组件
        bizUtil.layui.initDateInput($('.date-time'));

        // 初始化 详细地址 和 送达地址 （省市县组件）
        $('#userDistrict').add($('#deliveryAddress')).each(function () {
            var districtValue = $(this).attr('district_value') || undefined;

            $(this).district(layuiFormModule, districtValue);
        });
        // 注意，不能像下面一样使用 类选择器（事件会串）
        // $('.compoment-district').district(layuiFormModule);
    };
    // 再次封装 绑定上传附件事件
    var bindUploadAttachmentEvent = function (container) {
        shippingEvent.bindUploadAttachmentEvent({
            elem: $(container).find('.so-attachment-container .icon-link')
        }, {
            // 额外传入 layuiUploadModule
            layuiUpload: layuiUploadModule
        });
    };
    // 初始化已有订单数据
    var initOrderData = function (orderData, createNewLine) {
        if (!orderId || !orderData) {
            return;
        }
        
        var $_mainInfoContainer = $('#mainInfoContainer');
        var $_brokerDataContainer = $('#brokerDataContainer');
        var $_brokerInfoContainer = $('#brokerInfoContainer');
        var $_dangerousGoodsContainer = $('#dangerousGoodsContainer');

        // 主要信息
        bizUtil.data.setDataToContainer(orderData, $_mainInfoContainer);
        // 报关资料
        bizUtil.data.setDataToContainer(orderData, $_brokerDataContainer);
        // 报关信息
        bizUtil.data.setDataToContainer(orderData, $_brokerInfoContainer);

        // 重置 复选框的值
        $.each(['isChauffeur', 'isRequireWeighing', 'isCash'], function (i, checkboxName) {
            $_mainInfoContainer.find('[name=' + checkboxName + ']').prop('checked', orderData[checkboxName]);
        });

        // 船务信息
        var $_shippingContainer = $('#shippingContainer');
        // 清空原始船务信息内容
        $_shippingContainer.empty();
        // 重新创建船务信息
        $.each(orderData.orderShipping, function (i, shippingData) {
            var $_newShippingLine = createNewLine('shipping', shippingData);

            // 插入到DOM中
            $_shippingContainer.append($_newShippingLine);
            
            // 需要等新行 插入到DOM中，才能重新渲染
            bizUtil.layui.rerenderDistrictCompoment(layuiFormModule, $_newShippingLine);
            bizUtil.layui.rerenderDateInput($_newShippingLine);

            // 重新绑定附件上传事件
            bindUploadAttachmentEvent($_newShippingLine);

            // 更新船公司
            $_newShippingLine.find('.shipping-comp-code').val(shippingData.shippingCompShortname);
        });

        // 填充附件
        var $_shippingLine = $_shippingContainer.children();
        var fileNameSeparator = HC.constVariable.FILE_NAME_SEPARATOR;
        var fileLineContainerMap = {
            // 报关信息
            1: $_brokerInfoContainer,
            // 危品申报
            2: $_dangerousGoodsContainer
        };
        $.each(orderData.orderAtt, function (i, attachmentItem) {
            var attType = attachmentItem.attType;
            var attachmentName = attachmentItem.attName;
            var fileName = attachmentItem.attFileName;
            var serverFileName = attachmentItem.attFileUrl;
            
            // 处理 船务信息 附件
            if (attType === 3) {
                var $_attachmentItem = shippingEvent.createAttachmentItem(fileName, serverFileName);
                var $_targetShippingLine = $_shippingLine.eq(Number(attachmentName));

                // 添加到指定的船务信息容器中
                $_targetShippingLine.find('.so-attachment-container').append($_attachmentItem);

                // 保存附件id（后端用于更新文件记录内容）
                $_targetShippingLine.data(FILE_ID_DATANAME, attachmentItem.id);
            }
            // 处理 报关信息 和 危品申报 的附件
            else {
                // 从 报关信息 或 危品申报 的容器中 获取 指定的文件行容器
                var $_targetfileLine = fileLineContainerMap[attType].find('.file-line').filter(function () {
                    return $(this).data('attachment_name') == attachmentName;
                });

                var fileNames = fileName.split(fileNameSeparator);
                var serverFileNames = serverFileName.split(';');

                // 将 文件 添加到 指定的文件行
                $.each(fileNames, function (i, singleFileName) {
                    $_targetfileLine.append(HC.dom.createFileItem(singleFileName, serverFileNames[i]));
                });
                
                // 保存文件项id（后端用于更新文件记录内容）
                $_targetfileLine.data(FILE_ID_DATANAME, attachmentItem.id);
            }
        });

        // 全部layui表单组件重新渲染
        layuiFormModule.render();
        // 自定义组件的重新渲染
        initComponent();
    };

    // 绑定页面事件
    var bindEvent = function () {
        // 缓存变量
        var $_brokerDataContainer = $('#brokerDataContainer');
        var $_brokerInfoContainer = $('#brokerInfoContainer');
        var $_dangerousGoodsContainer = $('#dangerousGoodsContainer');
        var BOX_LINE_SELECTOR = '.box-line-container';
        var ADDRESS_LINE_SELECTOR = '.customer-address-line';

        // 将删除项的id 添加到 $_myForm中
        var setDeleteIdToContainContainer = function (removeElement, options) {
            var deleteLineId = $(removeElement).find('[name=id]').val();
            
            // 有id说明是编辑时删除已有项
            if (deleteLineId) {
                var deleteTypeDataName = DELETE_TYPE_PREFIX_DATANAME + options._type;
                var deleteLineArray = $_myForm.data(deleteTypeDataName) || [];

                deleteLineArray.push(deleteLineId);
                $_myForm.data(deleteTypeDataName, deleteLineArray);
            }
        };

        // 操作对象 配置信息 列表（箱型信息、装卸信息、船务信息 的 删除、添加、复制 配置）
        var operationTargetOptionsList = [
            // 箱型信息
            {
                // 该属性供内部使用，用于标识 配置类型
                _cnName: '箱型信息',
                _type: 'box',
                lineClassName: 'box-line-container',
                lineDeleteTips: '一组船务信息中最少要有一个箱型记录',
                // 箱型信息 不需要绑定 复制事件
                isBindCopyEvent: false,
                // 设置做柜时间（与上一行相同）
                afterAddDoneCallback: function ($_newLineContainer, $_targetLineContainer) {
                    var doarkTimeInputSelector = '[name=doarkTime]';

                    $_newLineContainer.find(doarkTimeInputSelector).val($_targetLineContainer.find(doarkTimeInputSelector).val());
                },
                // 记录被删除项的id
                afterDeleteDoneCallback: setDeleteIdToContainContainer

                // 还可以配置下面这些属性
                // container: 'form:first',
                // lineSelector: '.' + lineClassName （lineClassName 值为当前配置对象的 lineClassName 属性 ）
                // contextSelector: '',
                // belongsContainContainerSelector: '',
                // deleteOperationSelector: '.icon-delete',
                // addOperationSelector: '.icon-add',
                // copyOperationSelector: '.icon-copy',
                // isBindDeleteEvent: true,
                // isBindAddEvent: true,
                // beforeCreateLineCallback: ($_targetLineContainer, isCopyMode)=>{},
                // beforeInsertLineCallback: ($_newLineContainer, $_targetLineContainer, lineData)=>{},
                // afterCopyDoneCallback: ($_newLineContainer, $_targetLineContainer, lineData)=>{},
                // afterInsertLineCallback: ($_newLineContainer, $_targetLineContainer, lineData)=>{},
                // lineAnimateClassName: 'layui-anim layui-anim-upbit',
            },
            // 装卸信息
            {
                _cnName: '装卸信息',
                _type: 'address',
                lineClassName: 'customer-address-line',
                lineDeleteTips: '一组船务信息中最少要有一个装卸地点',
                afterDeleteDoneCallback: setDeleteIdToContainContainer
            },
            // 船务信息
            {
                _cnName: '船务信息',
                _type: 'shipping',
                lineClassName: 'shipping-line-container',
                contextSelector: '.shipping-icon-container > ',
                copyOperationSelector: '.icon-copy-container .icon-copy',
                lineDeleteTips: '订单中最少要有一组船务信息',
                // 有文件在上传过程中，不允许复制
                beforeCreateLineCallback: function ($_targetLineContainer, isCopyMode) {
                    if (!isCopyMode) {
                        return;
                    }

                    if ($_targetLineContainer.find('.attachment-item--loading').length) {
                        layer.msg('请等待 附件上传完成后 再执行 复制操作')

                        return false;
                    }
                },
                // 因为船务信息会通过“添加”、“复制”操作 动态创建，而layui.upload组件不支持on事件，所以需要动态绑定 上传附件事件
                afterInsertLineCallback: function ($_newShippingLineContainer, $_targetLineContainer, data) {
                    bindUploadAttachmentEvent($_newShippingLineContainer);
                },
                // 复制 船务信息时，需要 将附件信息也复制过来
                afterCopyDoneCallback: function ($_newShippingLineContainer, $_targetLineContainer, data) {
                    $_newShippingLineContainer.find('.so-attachment-container').append($_targetLineContainer.find('.so-attachment-item').clone());
                },
                afterDeleteDoneCallback: function (removeElement, options, $_belongsContainContainer) {
                    // 先设置被删除的船务信息id
                    setDeleteIdToContainContainer.call(this, removeElement, options);

                    // 再设置 本船务信息下面 剩余未删除的箱型信息id和装卸地址id
                    $(removeElement).find(BOX_LINE_SELECTOR).each(function (i) {
                        setDeleteIdToContainContainer.call(this, this, {
                            _type: 'box'
                        });
                    });
                    $(removeElement).find(ADDRESS_LINE_SELECTOR).each(function (i) {
                        setDeleteIdToContainContainer.call(this, this, {
                            _type: 'address'
                        });
                    });
                }
            }
        ];
        // 一键绑定 船务信息、箱型信息、装卸地点 的 删除、添加、复制 事件
        var createNewLine = shippingEvent.fastBindEvent(operationTargetOptionsList, $_myForm);

        // ------------------------- 上传、下载 事件 ----------------------------
        // 船务信息 SO 附件的 文件上传下载
        (function () {
            // 绑定附件上传功能
            bindUploadAttachmentEvent($_myForm);

            // 绑定 删除附件 功能（仅在界面上删除）
            $_myForm.on('click', '.so-item-container .icon-link-delete', function () {
                HC.dom.fadeOutRemove($(this).parent());
            });
        })();
        // 报关信息 和 危品申报的 文件上传下载
        (function () {
            var $_fileAreaContainer = $_brokerInfoContainer.add($_dangerousGoodsContainer);
            var fileUploadSelector = '.file-control-upload';
    
            // 删除文件（仅在界面上删除）
            $_fileAreaContainer.on('click', '.file-item .icon-delete', function () {
                HC.dom.fadeOutRemove($(this).parents('.file-item'));
            })
            // 阻止 “上传”元素 点击后的浏览器默认事件
            .on('click', fileUploadSelector, function () {
                return false;
            })
            // 阻止 “上传中”和“上传失败”的元素 点击后的浏览器默认事件
            .on('click', '.file-item--loading .file-name, .file-item--fail .file-name', function () {
                return false;
            });
    
            // 初始化 所有的 “上传” 元素
            $_fileAreaContainer.find(fileUploadSelector).each(function (i, uploadElement) {
                var $_targetFileLine = $(uploadElement).parent().prev();
    
                HC.upload({
                    // 触发上传的元素
                    elem: uploadElement,
                    // 多文件上传
                    multiple: true,
                    // 允许上传的文件类型 images（默认）、file、video、audio
                    accept: 'file',
                    // 最大文件大小限制（单位kb，默认不限制）
                    // size: 1024,
                }, {
                    layuiUpload: layuiUploadModule,
                    // 指定 存放文件项的容器
                    fileItemContainer: $_targetFileLine
                });
            });
        })();

        // ------------------------- 提交及取消订单 事件 ----------------------------
        (function () {
            // 获取页面表单域数据
            var createOrderData = function () {
                // 时间格式转换工具
                var toTimestamp = HC.date.toTimestamp;
                var toJavaLong = HC.data.toJavaLong;

                // 订单数据
                var orderData = $.extend(
                    {
                        // 复选框的值
                        isChauffeur: false,
                        isRequireWeighing: false,
                        isCash: false,
                        hasEntrust: false,
                        // 删除项id数组（存储编辑时 被删除的 船务信息id、箱型信息id、装卸地点id）
                        shipDelList: null,
                        addressDelList: null,
                        boxTypeDelList: null,
                        // 补充添加 拖车行所需要的字段（空值）
                        shipperId: '',
                        shipper: ''
                    },
                    {
                        // 船务信息
                        orderShipping: [],
                        // 订单附件列表
                        orderAtt: [],
                        // 订单备注
                        remark: $('#remarkTextarea').val()
                    },
                    // 主要信息
                    bizUtil.data.createFormDataByName($('#mainInfoContainer')),
                    // 报关资料
                    bizUtil.data.createFormDataByName($_brokerDataContainer, {
                        provinceSelector: 'select[name=deliveryProvince]',
                        citySelector: 'select[name=deliveryCity]',
                        countrySelector: 'select[name=deliveryCountry]',
                        streetSelector: 'select[name=deliveryStreet]'
                    }),
                    // 报关信息
                    bizUtil.data.createFormDataByName($_brokerInfoContainer)
                );

                // 转换id格式
                toJavaLong(orderData, 'id');
                // 去掉 upload组件添加的 file 名
                delete orderData.file;

                // 转换 制单时间
                orderData.makingTime = toTimestamp(orderData.makingTime);
                // 转换 申报日期
                orderData.declarationDate = toTimestamp(orderData.declarationDate);
    
                // 构建 船务信息列表数据
                $_myForm.find('.shipping-line-container').each(function () {
                    var shippingData = newFlowManager.createDataFromLine(this, "shipping");
                    
                    // 转换id格式
                    toJavaLong(shippingData, 'id');
                    // 去掉 upload组件添加的 file 名
                    delete shippingData.file;
                    
                    // 转换 截关时间
                    shippingData.cutoffTime = toTimestamp(shippingData.cutoffTime);
                    // 转换 截重时间
                    shippingData.cutheavyTime = toTimestamp(shippingData.cutheavyTime);
                    // 转换 截补料时间
                    shippingData.cuttingTime = toTimestamp(shippingData.cuttingTime);
                    // 转换 截放行时间
                    shippingData.releaseTime = toTimestamp(shippingData.releaseTime);

                    // 处理箱型数据
                    $.each(shippingData.orderBoxtype, function (i, orderBoxtype) {
                        // 转换id格式
                        toJavaLong(orderBoxtype, 'id');
                        // 转换箱型信息中的做柜时间
                        orderBoxtype.doarkTime = toTimestamp(orderBoxtype.doarkTime);
                    });

                    // 处理装卸地点数据
                    $.each(shippingData.orderAddresses, function (i, orderAddresses) {
                        // 转换id格式
                        toJavaLong(orderAddresses, 'id');
                    });

                    orderData.orderShipping.push(shippingData);
                });
    
                // 构建 附件列表数据
                var createAttachmentList = function (container, options) {
                    var settings = $.extend({
                        fileLineSelector: '.file-line',
                        fileItemSelector: '.file-item',
                        fileNameelector: '.file-name',
                        serverFileNameAttrName: 'server_file_name',
                        // 用于从文件行容器中 获取 附件类型的 data名
                        attachmentTypeDataName: 'attachment_type',
                        // 附件的类型，默认值为 3（表示 船务S/O。这个值如果在html中设置，得放在<form>标签上）
                        attachmentType: 3,
                        // 用于从文件行容器中 获取 附件所属小类的 data名
                        attachmentNameDataName: 'attachment_name',
                        // 文件名分隔符
                        fileNameSeparator: HC.constVariable.FILE_NAME_SEPARATOR,
                    }, options);
                    
                    var $_container = $(container);
                    var fileNameelector = settings.fileNameelector;
                    var serverFileNameAttrName = settings.serverFileNameAttrName;
                    var attachmentType = $_container.data(settings.attachmentTypeDataName) || settings.attachmentType;
                    var attachmentNameDataName = settings.attachmentNameDataName;
                    var fileNameSeparator = settings.fileNameSeparator;

                    // 附件列表
                    var attachmentList = [];
    
                    // 遍历 文件行容器
                    $_container.find(settings.fileLineSelector).each(function (fileLineIndex) {
                        var $_fileLineContainer = $(this);
                        var fileNameList = [];
                        var fileUrlList = [];
    
                        // 遍历行内的 文件项
                        $_fileLineContainer.find(settings.fileItemSelector).each(function () {
                            var $_fileItem = $(this);
    
                            // 添加 文件显示名 和 文件服务器地址名
                            fileNameList.push($_fileItem.find(fileNameelector).text());
                            fileUrlList.push($_fileItem.attr(serverFileNameAttrName));
                        });
    
                        // 构建文件数据对象
                        attachmentList.push({
                            // 文件项id
                            id: toJavaLong(null, $_fileLineContainer.data(FILE_ID_DATANAME)),
                            attType: attachmentType,
                            // 附件所属小类 值需为 字符串
                            attName: $_fileLineContainer.data(attachmentNameDataName) || ('' + fileLineIndex),
                            attFileName: fileNameList.join(fileNameSeparator),
                            attFileUrl: fileUrlList.join(';')
                        });
                    });
    
                    return attachmentList;
                };

                var orderAttachmentList = orderData.orderAtt;
                // 生成 船务信息 的附件列表数据
                orderAttachmentList.push.apply(orderAttachmentList, createAttachmentList($_myForm, {
                    fileLineSelector: '.shipping-line-container',
                    fileItemSelector: '.so-attachment-item'
                }));
                // 生成 报关信息 的附件列表数据
                orderAttachmentList.push.apply(orderAttachmentList, createAttachmentList($_brokerInfoContainer));
                // 生成 危品申报 的附件列表数据
                orderAttachmentList.push.apply(orderAttachmentList, createAttachmentList($_dangerousGoodsContainer));

                // 由于 复选框（携带司机本、需要过磅、现金结算）的值 需要 boolean 类型，所以在这里设置（.prop() 方法的返回值就是 boolean 类型）
                orderData.isChauffeur = $('#withDriverBookCheckbox').prop('checked');
                orderData.isRequireWeighing = $('#requireWeighingCheckbox').prop('checked');
                orderData.isCash = $('#cashCheckbox').prop('checked');

                // 编辑模式下，需要记录被删除项的id
                if (orderData.id) {
                    // 设置删除项的id
                    var setDeleteItemId = function (type, fieldName) {
                        // 将字符串数组，转换为数字数组
                        orderData[fieldName] = $.map($_myForm.data(DELETE_TYPE_PREFIX_DATANAME + type), function (value, key) {
                            return Number(value);
                        });
                    };

                    setDeleteItemId('box', 'boxTypeDelList');
                    setDeleteItemId('address', 'addressDelList');
                    setDeleteItemId('shipping', 'shipDelList');
                }
    
                return orderData;
            };
    
            // 提交订单数据
            var postOrderData = function (orderData) {
                if (!bizUtil.validator.verifyContainer($_myForm)) {
                    return;
                }

                // TODO: 对于 上传中 或 上传失败 的文件 进行提示
                HC.ajax.post('/ucenter/tms/order/order/add.shtml', {
                    data: JSON.stringify(orderData),
                    success: function (responseData, textStatus, jqXHR) {
                        // 弹窗的关闭回调
                        var closeHandler = function (index) {
                            // 关闭弹窗本身
                            window.parent.layer.close(index);
                            // 刷新列表页内容
                            bizUtil.frame.refreshListFrame();

                            // 勾选【继续新增】，则刷新iframe
                            if ($('#continueAddCheckbox').prop('checked')) {
                                window.location.reload();
                            }
                            // 没有勾选【继续新增】，则关闭iframe
                            else {
                                bizUtil.frame.closeCurrentIframeTab(window.parent);
                            }
                        };

                        window.parent.layer.alert('保存成功！', {
                            // 点击“确定”与右上角“X”按钮 是同一处理方式
                            yes: closeHandler,
                            cancel : closeHandler
                        });
                    }
                });
            };

            // 表单提交
            layuiFormModule.on('submit(save)', function (data) {
                // 保存订单数据
                postOrderData(createOrderData());

                return false;
            });
            // 表单提交/保存并委托
            layuiFormModule.on('submit(saveAndEntrust)', function (data) {
                var orderData = createOrderData();

                // 保存并委托 标记字段
                orderData.hasEntrust = true;
                
                // 保存订单数据
                postOrderData(orderData);

                return false;
            });
            // 取消订单
            $('#cancelButton').click(function (e) {
                bizUtil.frame.closeCurrentIframeTab(window.parent);
            });

            // 用于测试时，校对字段值是否正确
            $('#testFormData').click(function () {
                if (!bizUtil.validator.verifyContainer($_myForm)) {
                    return false;
                }
                console.log('统一规则校验【通过】');

                var orderData = createOrderData();

                var logPropertyName = HC.data.logPropertyName;

                logPropertyName([
                    "id","orderNo","makingTime","orderTemplateId","orderTemplate","carrierId","carrier","shipperId","shipper","entrustService","brokenStyle","isChauffeur","singleType","goodsType","isRequireWeighing","freightAgreementNo","isCash",
                    "freightAgreePrice","brokenAgreePrice","preparePay","customersBrokerId","brokenName","brokenAreaId","brokenAreaAddress","brokenAddress","brokenLinkman","brokenMobile","brokenTel","brokenFax","declarationStyle","declarationDate","declarationElements",
                    "remark","orderShipping","orderAtt","hasEntrust","shipDelList","addressDelList","boxTypeDelList"
                ], orderData, '最外层属性');
                logPropertyName([
                    'id','bkNo','shipName','shipTime','purposePortCode','purposePortShortname','shippingCompCode','shippingCompShortname','mentionPlaceCode','mentionPlace','cutoffTime','cutheavyTime','cuttingTime','releaseTime','orderBoxtype',"orderAddresses"
                ], orderData.orderShipping, '船务属性');
                logPropertyName([
                    'id','freightPrice','freightGain','shippingBoxtype','shippingBoxamount','putRequire','arkWeight','doarkTime'
                ], orderData.orderShipping[0].orderBoxtype, '箱型属性');
                logPropertyName([
                    "id","customersAddressId","orderPlace","orderAddressAreaid","orderAddress","orderAddressDetail","linkman","mobile","remark"
                ], orderData.orderShipping[0].orderAddresses, '装卸地点属性');
                logPropertyName([
                    "id","attFileName","attType","attName","attFileUrl"
                ], orderData.orderAtt, '附件属性');

                console.log('完整的订单数据', orderData);

                return false;
            });
        })();

        // ------------------------- 业务限制/校验/联动 事件 ----------------------------
        (function () {
            // 是否为 转关 方式（出口转关、进口转关）
            var isTransferWay = function (value) {
                var EXPORT_TRANSFER_VALUE = '2';
                var IMPORT_TRANSFER_VALUE = '4';
                
                return (value == EXPORT_TRANSFER_VALUE) || (value == IMPORT_TRANSFER_VALUE);
            };

            var $_withDriverBookCheckbox = $('#withDriverBookCheckbox');
            var $_brokenWaySelect = $('#brokenWaySelect');
            
            // 转关方式 与 司机本 联动
            layuiFormModule.on('select(brokenWay)', function(data) {
                // 如果报关方式是转关，必须勾选携带司机本
                if (isTransferWay(data.value)) {
                    // $_withDriverBookCheckbox.prop('checked', true);
                    // $_withDriverBookCheckbox.attr('checked', 'checked');
                    // layuiFormModule.render();
                    // layuiFormModule.render('checkbox', 'driverBook');
                    // 上面的代码都无效（input的check状态改了，但美化后的DOM对象没有更新）
    
                    // 所以改为 直接手动触发一次 复选框美化对象的click事件
                    if (!$_withDriverBookCheckbox.prop('checked')) {
                        $_withDriverBookCheckbox.siblings('.layui-form-checkbox').trigger('click');
                    }
                }
            });
            layuiFormModule.on('checkbox(driverBook)', function(data) {
                // 如果报关方式是转关，必须勾选携带司机本
                if (isTransferWay($_brokenWaySelect.val()) && !data.elem.checked) {
                    // 弹出提示
                    HC.tips.info('报关方式是转关，必须携带司机本', data.othis);
                    // 改为 【已选中】 的状态
                    data.othis.trigger('click');
                }
            });

            // 货物类型：如果选择【危品】，则显示危品信息区；如果选择【普货】，需要隐藏危品信息区
            layuiFormModule.on('select(goodsType)', function(data) {
                var GOODS_TYPE_DANGEROUS = '2';

                if (data.value == GOODS_TYPE_DANGEROUS) {
                    $_dangerousGoodsContainer.removeClass('hide');
                }
                else {
                    $_dangerousGoodsContainer.addClass('hide');
                }
            });

            // 运价协议号 与 运费协议价格 联动
            var $_freightAgreementNo = $("#freightAgreementNo");
            var $_freightAgreePrice = $('#freightAgreePrice');
            // keypress 事件 不能很准确地得到 this.value 的值，可能影响到空值的判断，所以改用 keyup 事件
            $_freightAgreementNo.keyup(function (e) {
                // 输入 运价协议号 之后，不能再输入 运费协议价格
                if (this.value) {
                    // 清空已有值
                    $_freightAgreePrice.val('')
                        // 设置只读
                        .prop('readonly', true);
                    // 添加提示
                    $_freightAgreePrice.on('mouseenter.freightAgreeReadonly', function () {
                        HC.tips.info('已有运价协议号，不需要再填写 运费协议价格', this);
                    });
                }
                else {
                    // 恢复可写
                    $_freightAgreePrice.prop('readonly', false);
                    // 直接移除
                    $_freightAgreePrice.off('mouseenter.freightAgreeReadonly');
                }
            });
            
            // 委托服务的下拉框，对应不同录入区
            layuiFormModule.on('select(entrustService)', function(data) {
                // 如果委托项为【运输，报关】，则需要显示 报关信息
                if (data.value == '3') {
                    $_brokerInfoContainer.removeClass('hide');
                }
                else {
                    $_brokerInfoContainer.addClass('hide');
                }

                // 如果委托项为【运输，代送资料】，则需要显示 报关行联系信息（页面中为 报关资料送至）
                if (data.value == '5') {
                    $_brokerDataContainer.removeClass('hide');
                }
                else {
                    $_brokerDataContainer.addClass('hide');
                }
            });

            // 船公司 显示简称
            layuiFormModule.on('select(shipping)', function(data) {
                var $_shippingCompanySelect = $(data.elem);
                $_shippingCompanySelect.parent().siblings('.shipping-comp-shortname').find('input').val(data.value);

                // 保存 船公司code
                $_shippingCompanySelect.siblings('[name=shippingCompCode]').val($_shippingCompanySelect.find(':checked').text());
            });
            
            // 箱型 决定 摆柜要求（尺寸为20的箱型，可以选择 任意摆柜要求，而对于非20尺寸的箱型，摆柜要求只能固定为“不限”）
            layuiFormModule.on('select(boxType)', function(data) {
                var PUT_WAY_UNLIMITED = '0';
                // 箱型尺寸，根据 箱型 isoCode 前面的数字来确定（isoCode箱型 = 尺寸+单位）
                var boxSize = parseInt(data.value, 10);
                
                var $_putRequireSelect = $(data.othis).parents(BOX_LINE_SELECTOR).find('select[name=putRequire]');
                var $_putRequireContainer = $_putRequireSelect.parent();

                if (boxSize != '20') {
                    $_putRequireSelect.val(PUT_WAY_UNLIMITED);
                    $_putRequireSelect.prop('disabled', true);
                    // 重新渲染
                    layuiFormModule.render('select', 'putRequireContainer');

                    // 在父容器上绑定 悬浮事件
                    $_putRequireContainer.on('mouseenter.putRequireDisable', function () {
                        HC.tips.info('对于非20尺寸的箱型，摆柜要求只能选择“不限”', this);
                    });
                }
                else {
                    $_putRequireSelect.prop('disabled', false);
                    // 重新渲染
                    layuiFormModule.render('select', 'putRequireContainer');
                    $_putRequireContainer.off('mouseenter.putRequireDisable');
                }
            });

            // 装卸地点/报关行信息 详情填充
            var customersAddressDetailUrl = '/ucenter/crm/customers/customersAddress/getDetail.shtml?id=';
            var customersBrokerDetailUrl = '/ucenter/crm/customers/customersBroker/getDetail.shtml?id=';
            layuiFormModule.on('select(customerAddress)', function(data) {
                var $_customerAddressSelect = $(data.elem);

                // 更改装卸地点之后，还需要保存名称 到隐藏域中
                $_customerAddressSelect.siblings('input[type=hidden]').val($_customerAddressSelect.find(':checked').text());

                // 请求数据 填充关联信息
                HC.ajax.get(customersAddressDetailUrl + data.value, {
                    // 填充 装卸地址
                    success: function (responseData, textStatus, jqXHR) {
                        var $_container = $_customerAddressSelect.parents(ADDRESS_LINE_SELECTOR);
                        
                        // 将 响应数据转换为 与name对应的字段名，并由bizUtil.data.setDataToContainer方法填充value
                        bizUtil.data.setDataToContainer({
                            orderAddressDetail: responseData.address,
                            linkman: responseData.uname,
                            mobile: responseData.mobile,
                            remark: responseData.notes
                        }, $_container);

                        // 重新渲染 省市县组件
                        $('#' + $_container.find('.compoment-district').attr('id')).district(layuiFormModule, responseData.addressAreaId);
                    }
                });
            });
            layuiFormModule.on('select(brokerList)', function(data) {
                var $_brokerSelect = $(data.elem);

                // 更改报关行之后，还需要保存名称 到隐藏域中
                $_brokerSelect.siblings('input[type=hidden]').val($_brokerSelect.find(':checked').text());

                // 请求数据 填充关联信息
                HC.ajax.get(customersBrokerDetailUrl + data.value, {
                    // 填充 报关行信息
                    success: function (responseData, textStatus, jqXHR) {
                        bizUtil.data.setDataToContainer({
                            brokenAddress: responseData.address,
                            brokenLinkman: responseData.uname,
                            brokenMobile: responseData.tel
                            // 下面两个字段 接口中没值
                            // brokenTel
                            // brokenFax
                        }, $_brokerDataContainer);

                        // 重新渲染 省市县组件
                        $('#' + $_brokerDataContainer.find('.compoment-district').attr('id')).district(layuiFormModule, responseData.areaId);
                    }
                });
            });
        })();

        // ------------------------- 下拉框填充隐藏域 ----------------------------
        (function () {
            // 自动根据下拉框的选择事件，填充： 订单模版名称 供应商名称 目的港简称 提还地点名称 （注意，部分本身有监听layui事件的，不能使用这种方法监听，否则原来的事件会失效）
            var optionsList = [
                {
                    layFilter: 'orderTemplate'
                    // relateElement: $('[name="preparePay"]'),
                    // relateSiblingName: 'shipTime',
                    // relateField: 'value'
                },
                {
                    layFilter: 'supplier'
                },
                {
                    layFilter: 'portList'
                },
                {
                    layFilter: 'wharfList'
                }
            ];

            // 关联 下拉框动作，并将下拉框的value填充到指定元素
            var relateDropDown = function (optionsList, layuiFormModule) {
                layuiFormModule = layuiFormModule || layui.form;

                $.each(optionsList, function (i, options) {
                    layuiFormModule.on('select(' + options.layFilter + ')', function(data) {
                        var $_select = $(data.elem);
                        var relateValue = '';

                        // 支持从select的text和value取值
                        switch (options.relateField) {
                            case 'value': {
                                relateValue = data.value;

                                break;
                            }
                            // 默认为 text 方式
                            case 'text':
                            default: {
                                // 如果 data.value 为空，则也使用空值
                                relateValue = data.value ? $_select.find(':checked').text() : '';

                                break;
                            }
                        }

                        if (options.relateElement) {
                            options.relateElement.val(relateValue);
                        }
                        else if (options.relateSiblingName) {
                            $_select.siblings('[name=' + options.relateSiblingName + ']').val(relateValue);
                        }
                        // 默认会赋值给相邻的隐藏域
                        else {
                            $_select.siblings('input[type=hidden]').val(relateValue);
                        }
                    });
                });
            };

            relateDropDown(optionsList, layuiFormModule);
        })();

        
        // ------------------------- 其它 事件 ----------------------------
        // window.onbeforeunload = function () {
        //     // Firefox 4、 Chrome 51、Opera 38 和Safari 9.1 版本以上，将使用浏览器默认提示文本，不显示下列自定义内容
        //     // 详见 https://developer.mozilla.org/zh-CN/docs/Web/API/Window/onbeforeunload
        //     return '有改动未保存，是否离开本页面？';
        // };

        return createNewLine;
    };

    // 页面初始化入口
    (function () {
        // 没有数据依赖的初始化
        initDefaultData();
        initComponent();

        // 初始化列表数据，当所有列表数据加载完成时，绑定 删除、添加、复制 事件
        (function () {
            // 列表型 数据接口 配置
            var dropDownOptionsList = [
                // 供应商列表
                {
                    url: '/ucenter/crm/supplier/supplier/search.shtml',
                    element: $('#supplierList'),
                    keyConvertMap: {
                        // 将 nameShort 字段 映射到 name 字段上
                        nameShort: 'name'
                    }
                },
                // 船公司信息列表
                {
                    url: '/ucenter/code/common/shipping/search.shtml',
                    element: $('#shipping'),
                    keyConvertMap: {
                        // 为了方便 船公司简称的填写事件，这里特意将 shippingName 指定为 id
                        shippingName: 'id',
                        shippingCode: 'name'
                    }
                },
                // 订单模版列表
                {
                    url: '/ucenter/tms/tp/orderTp/search.shtml',
                    element: $('#orderTmpl'),
                    keyConvertMap: {
                        // 将 tpName 字段 映射到 name 字段上
                        tpName: 'name'
                    }
                },
                // 目的港列表
                {
                    url: '/ucenter/code/common/port/search.shtml',
                    element: $('#portList'),
                    keyConvertMap: {
                        // 将 portCode、portCcode 字段 映射到 id、name 字段上
                        portCode: 'id',
                        portCcode: 'name'
                    }
                },
                // 提还地点列表
                {
                    url: '/ucenter/code/common/wharf/search.shtml',
                    element: $('#wharfList'),
                    keyConvertMap: {
                        // 将 code 字段 映射到 id 字段上
                        code: 'id'
                    }
                },
                // 箱型代码列表
                {
                    url: '/ucenter/code/common/contatypes/search.shtml',
                    element: $('#boxTypeList'),
                    keyConvertMap: {
                        // 将 isoCode 字段 同时映射到 id、name 字段上
                        isoCode: ['id','name']
                    }
                },
                // 报关行列表
                {
                    url: '/ucenter/tms/order/order/getAddressOrBroken.shtml?selectType=&addType=',
                    element: $('#brokerList'),
                    keyConvertMap: {
                        // 将 key、value 字段 映射到 id、name 字段上
                        key: 'id',
                        value: 'name'
                    }
                },
                // 装卸地址列表
                {
                    url: '/ucenter/tms/order/order/getAddressOrBroken.shtml?selectType=address&addType=',
                    element: $('#customerAddressList'),
                    keyConvertMap: {
                        // 将 key、value 字段 映射到 id、name 字段上
                        key: 'id',
                        value: 'name'
                    }
                }
            ];

            // 其它初始化数据需要的接口
            var initDataOptionsList = [
                // 校验协议号和箱型
                {
                    url: '/ucenter/tms/order/order/checkBoxType.shtml'
                }
            ];

            // 如果有订单id，则进入 查看详情 或 编辑订单 功能
            if (orderId) {
                // 获取订单详情
                initDataOptionsList.push({
                    url: '/ucenter/tms/order/order/getDetail.shtml?orderId=' + orderId
                });
            }
            
            // 根据数据请求结果，控制业务流程（数据获取成功则绑定事件）
            dataLoader.request({
                fetchOptionsList: dropDownOptionsList.concat(initDataOptionsList),
                allDoneCallback: function (deferredList) {
                    // 数据全部加载完 再绑定事件
                    var createNewLine = bindEvent();

                    // TODO: 待重构createNewLine这个变量的赋值（目前是 在bindEvent中 调用 shippingEvent.fastBindEvent 才能得到）
                    initOrderData(deferredList.pop(), createNewLine);
                },
                perDoneCallback: function (i, fetchOptions, dataObjects, textStatus, jqXHR) {
                    // 对于 dropDownOptionsList 的请求，需要渲染下拉框
                    if (i < dropDownOptionsList.length) {
                        bizUtil.layui.renderSelect($.extend({
                            layuiFormModule: layuiFormModule,
                            // afterRenderCallback: function ($_dropDownList, settings) {},
                            dataList: dataObjects
                        }, fetchOptions));
                    }
                    else {
                        // console.log('第[%s]条为其它数据', (i + 1), dataObjects);
                        // 协议号和箱型 对应数据
                        $("#freightAgreementNo").data(dataObjects);
                    }
                },
                // notAllDoneCallback: function () {},
                // failCallback: function () {},
                // concurrenceLimit: 0,
                // delay: 1000
            }); // end dataLoader.request

        })();  // end 初始化列表数据

    })();  // end 页面初始化入口

}); // end 主功能执行入口