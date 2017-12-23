/*
 * 配置扩展方法路径
 * terry zhong
 * 2017-7-25
 * v1.0
 */
// 
layui.config({
    base: '/view/tms/static/js/' // 模块目录
}).extend({ // 模块别名
    tms_tab: 'tms_tab'
});

//初始化
$(function() {
    // 获取当前登录用户信息，并在系统界面顶部栏 显示帐号名（此功能亦可用于 检测用户登录是否超时）
    getUserInfo(function(dataObjects) {
        var accountName = dataObjects.account;

        // 在系统界面顶部栏 显示账户名
        $('#accountName', window.top.document).text(accountName)
            .attr('title', accountName);
    });
});

//获取路径参数
function getUrlParam(name) {
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
    var r = window.location.search.substr(1).match(reg);
    if (r != null) return unescape(r[2]);
    return null;
}

// 获取当前登录用户信息
function getUserInfo(successCallback, failureCallback) {
    HC.ajax.get('/ucenter/userinfo.shtml', {
        success: successCallback,
        codeError: failureCallback,
        error: failureCallback
    });
}

//退出
function logout() {
    $.ajax({
        url: '/logout.shtml',
        type: "POST",
        dataType: 'json',
        beforeSend: function() {},
        success: function(d) {
            top.location.href = '/';
        }
    });
    return false;
}

//日期格式化
Date.prototype.format = function(format) {
    /* 
     * eg:format="yyyy-MM-dd hh:mm:ss"; 
     */
    var o = {
        "M+": this.getMonth() + 1, // month  
        "d+": this.getDate(), // day  
        "h+": this.getHours(), // hour  
        "m+": this.getMinutes(), // minute  
        "s+": this.getSeconds(), // second  
        "q+": Math.floor((this.getMonth() + 3) / 3), // quarter  
        "S": this.getMilliseconds() // millisecond  
    };
    if (/(y+)/.test(format)) {
        format = format.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    }
    for (var k in o) {
        if (new RegExp("(" + k + ")").test(format)) {
            format = format.replace(RegExp.$1, RegExp.$1.length == 1 ? o[k] : ("00" + o[k]).substr(("" + o[k]).length));
        }
    }
    return format;
};

//选中input时光标移到最后面
$.fn.focusEnd = function() {
    var $self = this,
        $len = $($self).val().length;

    var $input = $self[0];
    if ($input.createTextRange) {
        var $range = $input.createTextRange();
        $range.collapse(true);
        $range.moveEnd('character', $len);
        $range.moveStart('character', $len);
        $range.select();
    } else if ($input.setSelectionRange) {
        $input.focus();
        $input.setSelectionRange($len, $len);
    }
    return $self;
}

//数组去重
function deWeightArr($arr) {
    var $newArr = [],
        $newObj = {};
    if ($arr.length > 0) {
        for (var $i = 0; $i < $arr.length; $i++) {
            if (!$newObj[$arr[$i]]) {
                $newArr.push($arr[$i]);
                $newObj[$arr[$i]] = true;
            }
        }
    }
    return $newArr;
}

////////////////////////////////////////////////////////
//公共返回数据接口，如司机、拖车、车架等

//获取司机列表
function getDriverList() {
    var $arrs = [];
    $.ajax({
        type: 'GET',
        url: '/ucenter/tms/capacity/driver/search.shtml',
        async: false,
        dataType: 'JSON',
        success: function(d) {
            var $code = d.code,
                $msg = d.msg,
                $objects = d.objects;

            if ($code === 'SUCCESS') {
                if ($objects.length > 0) {
                    for (var $i = 0; $i < $objects.length; $i++) {
                        $arrs.push($objects[$i]);
                    }
                }
            }
        }
    });
    return $arrs;
}

//获取拖车列表
function getTrailerList() {
    var $arrs = [];
    $.ajax({
        type: 'GET',
        url: '/ucenter/tms/capacity/trailer/search.shtml',
        async: false,
        dataType: 'JSON',
        success: function(d) {
            var $code = d.code,
                $msg = d.msg,
                $objects = d.objects;

            if ($code === 'SUCCESS') {
                if ($objects.length > 0) {
                    for (var $i = 0; $i < $objects.length; $i++) {
                        $arrs.push($objects[$i]);
                    }
                }
            }
        }
    });
    return $arrs;
}

//获取车架列表
function getCarFrameList() {
    var $arrs = [];
    $.ajax({
        type: 'GET',
        url: '/ucenter/tms/capacity/carFrame/search.shtml',
        async: false,
        dataType: 'JSON',
        success: function(d) {
            var $code = d.code,
                $msg = d.msg,
                $objects = d.objects;

            if ($code === 'SUCCESS') {
                if ($objects.length > 0) {
                    for (var $i = 0; $i < $objects.length; $i++) {
                        $arrs.push($objects[$i]);
                    }
                }
            }
        }
    });
    return $arrs;
}

//通过司机id获取司机详情
function getDriverById(o) {
    var $objs = {};
    $.ajax({
        type: 'GET',
        url: '/ucenter/tms/capacity/driver/' + o + '.shtml',
        async: false,
        dataType: 'JSON',
        success: function(d) {
            var $code = d.code,
                $msg = d.msg,
                $objects = d.objects;

            if ($code === 'SUCCESS') {
                $objs = $objects;
            }
        }
    });
    return $objs;
}

//通过拖车车牌获取司机详情
function getDriverByCarNo(o) {
    var $objs = {};
    $.ajax({
        type: 'GET',
        url: '/ucenter/tms/capacity/driver/getDriverByCarNo.shtml',
        data: { carNo: o },
        async: false,
        dataType: 'JSON',
        success: function(d) {
            var $code = d.code,
                $msg = d.msg,
                $objects = d.objects;

            if ($code === 'SUCCESS') {
                $objs = $objects;
            }
        }
    });
    return $objs;
}

//通过运单ID查询改派推荐司机详情
function getDriverByWbid(o) {
    var $objs = {};
    $.ajax({
        type: 'GET',
        url: '/ucenter/tms/waybill/waybill/searchSendDriver.shtml',
        data: { id: o },
        async: false,
        dataType: 'JSON',
        success: function(d) {
            var $code = d.code,
                $msg = d.msg,
                $objects = d.objects;

            if ($code === 'SUCCESS') {
                $objs = $objects;
            }
        }
    });
    return $objs;
}

//获取费用定义，t：费用类型，1应收，2应付，3车辆，b：业务类型
function getCostItem(t, b) {
    var $arrs = [];
    $.ajax({
        type: 'GET',
        url: '/ucenter/code/common/costItem/page.shtml',
        data: { business: b, costType: t, pageNum: -1 },
        async: false,
        dataType: 'JSON',
        success: function(d) {
            var $code = d.code,
                $msg = d.msg,
                $objects = d.objects.list;

            if ($code === 'SUCCESS') {
                if ($objects.length > 0) {
                    for (var $i = 0; $i < $objects.length; $i++) {
                        var $objs = {};
                        $objs.costId = $objects[$i].id;
                        $objs.costName = $objects[$i].costName;
                        $arrs.push($objs);
                    }
                }
            }
        }
    });
    return $arrs;
}

//通过统一信用代码获取企业信息
function getCompanyByUsc(o) {
    var $objs = {};
    $.ajax({
        type: 'GET',
        url: '/ucenter/standard/common/companyStandard/getCompanyByUsc.shtml',
        data: { usc: o },
        async: false,
        dataType: 'JSON',
        success: function(d) {
            var $code = d.code,
                $msg = d.msg,
                $objects = d.objects;

            if ($code === 'SUCCESS') {
                $objs = $objects;
            }
        }
    });
    return $objs;
}

/**
 * 验证统一信用代码唯一性
 * @param {*} o 
 * @param {*} type 1为客户，2为供货商
 */
function verifyCompanyByUsc(o, type) {
    var $objs = {};
    var $url;

    if (type == 1 || type == null) {
        $url = '/ucenter/crm/customers/customers/checkCustomersUsc.shtml';
    } else if (type == 2) {
        $url = '/ucenter/crm/supplier/supplier/checkSupplierUsc.shtml';
    }
    $.ajax({
        type: 'GET',
        url: $url,
        data: { usc: o },
        async: false,
        dataType: 'JSON',
        success: function(d) {
            var $code = d.code,
                $msg = d.msg,
                $objects = d.objects;
            // $objs = d;
            if ($code === 'ERROR_CUSTOMERS_EXIST' || $code === 'ERROR_SUPPLIER_EXIST') {
                $objs = $msg;
            }
        }
    });
    return $objs;
}

//初使化供应商/客户类型数据（t：1供应商，2客户）
function getSupplierCustomerArrs(t) {
    t = (typeof t == 'undefined') ? 1 : t;
    var $arrs = [];
    if (t == 1) {
        $arrs = [
            [550, '运输公司'],
            [553, '车主'],
            [554, '报关行'],
            [555, '仓储'],
            [556, 'GPS终端'],
            [557, '保险公司'],
            [558, '船代'],
            [559, '制单代理']
        ];
    } else if (t == 2) {
        $arrs = [
            [550, '运输公司'],
            [551, '货主'],
            [552, '货代'],
            [553, '车主']
        ];
    }
    return $arrs;
}

//生成供应商/客户类型下拉框列表（t：1供应商，2客户）
function getSupplierCustomerList(t) {
    t = (typeof t == 'undefined') ? 1 : t;
    var htmlArr = [];
    var arrs = getSupplierCustomerArrs(t);
    if (arrs.length > 0) {
        for (var i = 0; i < arrs.length; i++) {
            htmlArr.push('<option value="' + arrs[i][0] + '">' + arrs[i][1] + '</option>');
        }
    }
    return htmlArr.join('');
}

//获取客户数据列表
function getCustomerList() {
    var $arrs = [];
    $.ajax({
        type: 'GET',
        url: '/ucenter/crm/customers/customers/page.shtml',
        data: { pageNum: -1 },
        async: false,
        dataType: 'JSON',
        success: function(d) {
            var $code = d.code,
                $msg = d.msg,
                $objects = d.objects.list;

            if ($code === 'SUCCESS') {
                if ($objects.length > 0) {
                    for (var $i = 0; $i < $objects.length; $i++) {
                        if ($objects[$i].status != 3) {
                            $arrs.push($objects[$i]);
                        }
                    }
                }
            }
        }
    });
    return $arrs;
}

//获取供应商数据列表
function getSupplierList() {
    var $arrs = [];
    $.ajax({
        type: 'GET',
        url: '/ucenter/crm/supplier/supplier/page.shtml',
        data: { pageNum: -1 },
        async: false,
        dataType: 'JSON',
        success: function(d) {
            var $code = d.code,
                $msg = d.msg,
                $objects = d.objects.list;

            if ($code === 'SUCCESS') {
                if ($objects.length > 0) {
                    for (var $i = 0; $i < $objects.length; $i++) {
                        if ($objects[$i].status != 3) {
                            $arrs.push($objects[$i]);
                        }
                    }
                }
            }
        }
    });
    return $arrs;
}

//获取订单状态
function setOrderStatus(n) {
    var $map = {
        100: '录入',
        200: '已委托',
        300: '<span style="color:#f00;">已接单</span>',
        400: '<span style="color:#34a8ff;">作业中</span>',
        500: '作业完成',
        600: '订单完成'
    };
    return $map[n] || '--';
}

//获取运单状态
function setStatus(n) {
    var $map = {
        100: '录入',
        200: '已委托',
        300: '<span style="color:#f00;">已接单</span>',
        310: '申请撤销',
        311: '已撤销',
        320: '已打EIR单',
        321: '催缴约柜费',
        322: '已缴约柜费',
        330: '等待派车',
        400: '已派车',
        401: '司机接单',
        402: '<span style="color:#34a8ff;">作业中</span>',
        403: '推荐确认中',
        404: '改派审核中',
        409: '改派失败',
        410: '已提柜',
        420: '装货中',
        430: '还柜中',
        500: '作业完成',
        510: '回单'
    };
    return $map[n] || '--';
}

//获取摆柜位置
function setPutarkPosition(n) {
    var $map = {
        0: '不限',
        1: '摆头',
        2: '置中',
        3: '摆尾'
    };
    return $map[n] || '--';
}

//获取急单类型
function setSingleType(n) {
    var $map = {
        1: '正常单',
        2: '赶船',
        3: '赶补料',
        4: '赶截关'
    };
    return $map[n] || '--';
}

//获取运单类型
function setWaybillType(n) {
    var $map = {
        1: '孖柜',
        2: '渡柜',
        3: '带货'
    };
    return $map[n] || '--';
}

//获取运单费用类型
function setCostStatus(n) {
    var $map = {
        0: '录入',
        1: '待复核',
        2: '已核算',
        3: '已确认',
        4: '生成帐单',
        7: '录入',
        8: '录入'
    };
    return $map[n] || '--';
}

//获取城配运单状态
function setCityWaybillStatus(n) {
    var $map = {
        100: '录入',
        300: '已接单',
        400: '已派车',
        500: '作业完成',
        510: '已回单'
    };
    return $map[n] || '--';
}

//获取报关方式
function setBrokenStyle(n) {
    var $map = {
        1: '出口清关',
        2: '出口转关',
        3: '进口清关',
        4: '进口转关'
    };
    return $map[n] || '--';
}

//获取委托服务
function setEntrustService(n) {
    var $map = {
        1: '运输',
        2: '关务',
        3: '运输，关务',
        4: '船务',
        5: '运输，代送资料'
    };
    return $map[n] || '--';
}

//获取供应商/客户类型（t：1供应商，2客户）
function setSupplierCustomerType(n, t) {
    t = (typeof t == 'undefined') ? 1 : t;
    var $map = {};
    if (t == 1) {
        $map = {
            550: '运输公司',
            553: '车主',
            554: '报关行',
            555: '仓储',
            556: 'GPS终端',
            557: '保险公司',
            558: '船代',
            559: '制单代理'
        };
    } else if (t == 2) {
        $map = {
            550: '运输公司',
            551: '货主',
            552: '货代',
            553: '车主'
        };
    }
    return $map[n] || '--';
}

//获取异常费用
function setExcepCost(n, t) {
    var $str = n != null ? '<a lay-event="' + t + '" style="color:#1E9FFF; text-decoration:underline;">' + n + '</a>' : 0;
    return $str;
}

//获取费用
function setCost(n) {
    var $str = n != null ? n : 0;
    return $str;
}

//获取订单或SO字段
function setOrderNo(n) {
    var $str = n != null ? n : '----';
    return $str;
}

//获取装货、卸货地址
function setGoodsAddress(n) {
    var $str = '';
    if (n != null) {
        n = n.split(';');
        if (n.length > 1) {
            $str = deWeightArr(n).join(';');
        } else {
            $str = n.join('');
        }
    }
    return $str;
}

//搜索作业时间初始化
function setSearchJobData(s, e) {
    var startDate = new Date().format('yyyy-MM-dd'),
        endDate = new Date(new Date().getTime() + 4 * 24 * 60 * 60 * 1000).format('yyyy-MM-dd');
    $('input[name="' + s + '"]').val(startDate);
    $('input[name="' + e + '"]').val(endDate);
}

//统一信息提示框，layer：主体（parent.layer/layer），txt：提示信息，支持html，option：参数设置
function setLayerAlert(layer, txt, option) {
    var options = $.extend({
        title: false,
        btnAlign: 'r',
        closeBtn: 0,
        shadeClose: true,
        yes: function(index) {
            layer.close(index);
        }
    }, option);
    layer.alert(txt, options);
}

//统一确认（confirm）信息提示框，layer：主体（parent.layer/layer），txt：提示信息，支持html，fun：方法函数
function setLayerConfirm(layer, txt, fun) {
    parent.layer.confirm(txt, {
        title: false,
        closeBtn: 0
    }, fun);
}

//统一获取id判断
function getUrlId(id) {
    if (!id) {
        setLayerAlert(parent.layer, '无效的id', {
            yes: function() {
                parent.layer.closeAll();
            }
        });
    }
    return parseInt(id) || -1;
}

/**
 * 校验车牌(依赖HCValidator)
 * 
 * @param options.target    失焦触发的容器
 * @param options.notice    规则  1为失去焦点时触发  2为提交时触发
 * @param options.callBack  调用回调取得要校验的车牌号
 * 
 */
function verifyCarNuber(options) {
    if (options.notice === 1) {
        $(options.target).blur(function(ev) {
            var valueObj = options.callBack();
            if ($.trim(valueObj.signVal).length == 0) {
                HCValidator.closeTips($(this));
                return;
            }
            var verifyResult = HCValidator.verifyValue('carNo', valueObj.firstWord + valueObj.signVal);
            if (!verifyResult.isValidated) {
                console.log('统一规则校验【不通过】，校验提示文本：[%s]，校验不通过的元素为：', verifyResult.text, verifyResult.element, verifyResult);
            }
            HCValidator.toggleTipsWithVerifyResult($(this), verifyResult);
        });
    } else {
        var valueObj = options.callBack();
        if ($.trim(valueObj.signVal).length == 0) {
            HCValidator.closeTips($(this));
            return true;
        }
        var verifyResult = HCValidator.verifyValue('carNo', valueObj.firstWord + valueObj.signVal);
        if (!verifyResult.isValidated) {
            bizUtil.validator.showElementVerifyError($(options.target), verifyResult.text);
        }

        return verifyResult.isValidated;
    }
}