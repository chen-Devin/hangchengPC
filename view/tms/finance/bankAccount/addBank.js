$(function() {
    layui.use(['form', 'layer'], function() {
        var form = layui.form,
            layer = layui.layer,
            $ = layui.jquery;

        //加载开户银行下拉框数据
        $.ajax({
            type: 'GET',
            url: '/ucenter/general/finance/settlementChannel/search.shtml',
            async: false,
            success: function(d) {
                var $code = d.code,
                    $msg = d.msg,
                    $objects = d.objects;

                if ($code != 'SUCCESS') return false;
                if ($objects.length > 0) {
                    for (var $i = 0; $i < $objects.length; $i++) {
                        if ($objects[$i].bankName) {
                            $('select[name="bank"]').append('<option value="' + $objects[$i].bankName + '">' + $objects[$i].bankName + '</option>');
                        }
                    }
                    form.render('select');
                }
            }
        });

        form.on('radio(way)', function(data) {
            if (data.value == "1" || data.value == "2") {
                $(".row-bank").hide();
                $("select[name='bank']").attr("lay-verify", "");
                $("input[name='branch']").attr("lay-verify", "");
            } else {
                $(".row-bank").show();
                $("select[name='bank']").attr("lay-verify", "required");
                $("input[name='branch']").attr("lay-verify", "branch");
            };
        });

        var type = $.trim(getUrlParam("do")),
            accountNo = $.trim(getUrlParam("accountNo")),
            id = $.trim(getUrlParam("id"));

        //查看
        if (type == "detail") {
            $("button").hide();
            $(".btn-group").hide();

            $.post('/ucenter/general/finance/settlementChannel/show.shtml', {
                accountNo: accountNo
            }, function(d) {
                var $code = d.code,
                    $msg = d.msg,
                    $objects = d.objects;

                if ($code === 'SUCCESS') {
                    var way = $objects.channelType;
                    if (way == 0) {
                        $("span:contains('银行')").click();
                    } else if (way == 1) {
                        $("span:contains('支付宝')").click();
                    } else {
                        $("span:contains('微信')").click();
                    }
                    $("select[name='bank']").val($objects.bankName);
                    $("input[name='branch']").val($objects.bankBranchName);
                    $("input[name='name']").val($objects.accountName);
                    $("input[name='account']").val($objects.accountNo);
                    $("input[name='balance']").val($objects.balanceInit);
                    $("select[name='status']").val($objects.status);
                    $("textarea[name='remarks']").val($objects.remarks);
                    $("input,textarea,select").prop("disabled", true);
                    form.render();
                } else {
                    parent.layer.alert('数据异常');
                    return false;
                }
            }, 'json');

            //获取创建人、创建时间、更新者、更新时间
            $.get('/ucenter/general/finance/settlementChannel/' + id + '.shtml', function(d) {
                var $code = d.code,
                    $msg = d.msg,
                    $objects = d.objects;

                if ($code != 'SUCCESS') return false;

                $("input[name='creator']").val($objects.creator);
                $("input[name='createDate']").val($objects.createDate != null ? new Date($objects.createDate).format('yyyy-MM-dd hh:mm:ss') : '');
                $("input[name='modifier']").val($objects.modifier);
                $("input[name='modifyDate']").val($objects.modifyDate != null ? new Date($objects.modifyDate).format('yyyy-MM-dd hh:mm:ss') : '');
            }, 'json');
        };

        //自定义验证规则
        form.verify({
            branch: function(value) {
                if (value.length == 0) {
                    return '请输入分行或支行名称';
                } else if (!$jsReg.zhName.test(value)) {
                    return '分行或支行名称格式错误';
                }
            },
            name: function(value) {
                if (value.length == 0) {
                    return '请输入收款人名称/姓名';
                } else if (!$jsReg.zhName.test(value)) {
                    return '收款人名称/姓名格式错误';
                }
            },
            account: function(value) {
                if (value.length == 0) {
                    return '请输入账号';
                } else if ($("input[name='way']:checked").val() == "银行" && !$jsReg.integer.test(value)) {
                    return '账号格式错误';
                } else if ($("input[name='way']:checked").val() == "支付宝" && !$jsReg.zhName.test(value)) {
                    return '账号格式错误';
                } else if ($("input[name='way']:checked").val() == "微信" && !$jsReg.wechat.test(value)) {
                    return '账号格式错误';
                }
            },
            balance: function(value) {
                if (value.length == 0) {
                    return '请输入初始余额';
                } else if (!$jsReg.plus.test(value)) {
                    return '初始余额格式错误';
                }
            }
        });

        //焦点事件
        $('#branch').focus(function() {
            // layer.tips('200位字符', '#branch', {
            //   tips: [3, '#78BA32']
            // });
        });
        $('#branch').blur(function() {
            if ($(this).val().length == 0) {
                layer.tips('请输入分行或支行名称', '#branch', {
                    tips: [3, '#d84747']
                });
            } else if ($(this).val().length > 0) {
                if (!$jsReg.zhName.test($(this).val())) {
                    layer.tips('分行或支行名称格式错误', '#branch', {
                        tips: [3, '#d84747']
                    });
                }
            }
        });
        $('#name').focus(function() {
            // layer.tips('200位字符', '#name', {
            //   tips: [3, '#78BA32']
            // });
        });
        $('#name').blur(function() {
            if ($(this).val().length == 0) {
                layer.tips('请输入收款人名称/姓名', '#name', {
                    tips: [3, '#d84747']
                });
            } else if ($(this).val().length > 0) {
                if (!$jsReg.zhName.test($(this).val())) {
                    layer.tips('收款人名称/姓名格式错误', '#name', {
                        tips: [3, '#d84747']
                    });
                }
            }
        });
        $('#account').focus(function() {
            // layer.tips('200位字符', '#name', {
            //   tips: [3, '#78BA32']
            // });
        });
        $('#account').blur(function() {
            if ($(this).val().length == 0) {
                layer.tips('请输入账号', '#account', {
                    tips: [3, '#d84747']
                });
            } else if ($("input[name='way']:checked").val() == "银行" && !$jsReg.integer.test($(this).val())) {
                layer.tips('账号格式错误', '#account', {
                    tips: [3, '#d84747']
                });
            } else if ($("input[name='way']:checked").val() == "支付宝" && !$jsReg.zhName.test($(this).val())) {
                layer.tips('账号格式错误', '#account', {
                    tips: [3, '#d84747']
                });
            } else if ($("input[name='way']:checked").val() == "微信" && !$jsReg.wechat.test($(this).val())) {
                layer.tips('账号格式错误', '#account', {
                    tips: [3, '#d84747']
                });
            }
        });
        $('#balance').focus(function() {
            // layer.tips('200位字符', '#balance', {
            //   tips: [3, '#78BA32']
            // });
        });
        $('#balance').blur(function() {
            if ($(this).val().length == 0) {
                layer.tips('请输入初始余额', '#balance', {
                    tips: [3, '#d84747']
                });
            } else if ($(this).val().length > 0) {
                if (!$jsReg.plus.test($(this).val())) {
                    layer.tips('初始余额格式错误', '#balance', {
                        tips: [3, '#d84747']
                    });
                }
            }
        });

        //监听提交
        var flag = true;
        form.on('submit(submit)', function(data) {
            //数据源
            flag = false;
            $(".layui-form input,textarea,select").prop('disabled', true).css({
                'background': '#eee'
            });
            $("select,option,dd").addClass('layui-disabled');
            $(".btn-save").html("确定添加");
            $(".btn-return").html("返回编辑");
            $(".btn-return").off("click")
            $(".btn-return").on("click", function() {
                $(".layui-form input,textarea").prop('disabled', false).css({
                    'background': '#fff'
                });
                $("select,option,dd").removeClass('layui-disabled');
                $(".btn-save").html("保存");
                flag = true;
                $(".btn-return").html("取消");
                return false;
            })
            $(".btn-save").off("click");
            $(".btn-save").on("click", function() {
                $(".btn-save").blur();
                if (flag == true) {
                    return;
                }

                var $saveData = {
                    channelType: $.trim(data.field.way),
                    accountName: $.trim(data.field.name),
                    accountNo: $.trim(data.field.account),
                    balanceInit: $.trim(data.field.balance),
                    status: $.trim(data.field.status),
                    remarks: $.trim(data.field.remarks)
                }
                $saveData.bankName = $saveData.channelType == 0 ? $.trim(data.field.bank) : "";
                $saveData.bankBranchName = $saveData.channelType == 0 ? $.trim(data.field.branch) : "";

                //调用接口
                $.ajax({
                    type: 'POST',
                    url: '/ucenter/general/finance/settlementChannel/insert.shtml',
                    dataType: "json",
                    contentType: "application/json",
                    data: JSON.stringify($saveData),
                    success: function(d) {
                        var $code = d.code,
                            $msg = d.msg,
                            $objects = d.objects;

                        if ($code === 'SUCCESS') {
                            parent.layer.alert("保存成功", {
                                closeBtn: 0,
                                yes: function(index) {
                                    $(window.parent['f1'].document).find('.btn-search').click();
                                    parent.layer.closeAll();
                                }
                            });
                        } else {
                            parent.layer.alert('保存信息失败，请重新填写！');
                            return false;
                        }
                    }
                });
            });
            return false;
        });
        $(".btn-close").off("click");
        $(".btn-close").on("click", function() {
            if (flag == false) {
                return;
            }
            var index = parent.layer.getFrameIndex(window.name);
            parent.layer.close(index);
        });
    });
});