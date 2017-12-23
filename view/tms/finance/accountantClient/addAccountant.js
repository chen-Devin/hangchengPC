$(function() {
    layui.use(['form', 'layer', 'layedit', 'laydate'], function() {
        var form = layui.form,
            $ = layui.jquery;

        $('#regDistrict').district(form);
        $('#linkDistrict').district(form);

        //获取公司json
        $.get('/ucenter/general/finance/financeSubject/getSubjectNameOrId.shtml?id=', function(d) {
            var $code = d.code,
                $msg = d.msg,
                $objects = d.objects;

            if ($code === 'SUCCESS') {
                // companyList(0, $objects);
                // $('select[name="parentSubject"]').append('<option value="' + $arrs[$i].id + '">' + $arrs[$i].subjectName + '</option>');
                for (var $i = 0; $i < $objects.length; $i++) {
                    $('select[name="parentSubject"]').append('<option value="' + $objects[$i].id + '">' + $objects[$i].subjectName + '</option>');
                }
                form.render('select');
            } else {
                setLayerAlert(parent.layer, '获取信息失败');
                return false;
            }
        }, 'json');

        //监听提交
        form.on('submit(save)', function(data) {
            $('.save').blur();
            var objects = {
                subjectName: $.trim(data.field.courseTitle),
                parentId: $.trim(data.field.parentSubject),
                subjectCode: $.trim(data.field.accountNumber),
                hasReceived: $.trim(data.field.income),
                hasHandle: $.trim(data.field.expend)
            };
            //保存数据，调用接口
            $.ajax({
                type: 'POST',
                url: '/ucenter/general/finance/financeSubject/add.shtml',
                data: objects,
                success: function(d) {
                    var $code = d.code,
                        $msg = d.msg,
                        $objects = d.objects;

                    if ($code === 'SUCCESS') {
                        setLayerAlert(parent.layer, '保存成功', {
                            yes: function(index) {
                                parent.layer.close(index);
                                window.location.reload();
                            }
                        });
                    } else if ($code === 'ERROR_COMPANY_EXIST') {
                        setLayerAlert(parent.layer, '企业已存在');
                    } else {
                        setLayerAlert(parent.layer, '保存信息失败，请重新填写');
                    }
                }
            });
            return false;
        });

        $('.courseTitle').focus(function() {
            $(".courseTitleHint").html("");
            $(".courseTitleBox").removeClass("err");
        })
        $('.courseTitle').blur(function() {
            if ($(this).val().length == 0) {
                $(".courseTitleHint").html("请输入科目名称");
                $(".courseTitleBox").addClass("err");
            } else if ($(this).val().length > 40) {
                if (!$jsReg.accountingSubject.test($(this).val())) {
                    $(".courseTitleHint").html("不超过40个字符");
                    $(".courseTitleBox").addClass("err");
                }
            }
        });
        $('.accountNumber').focus(function() {
            $(
                ".accountNumberHint").html("");
            $(".accountNumber").removeClass("err");
        })
        $('.accountNumber').blur(function() {
            if ($(this).val().length == 0) {
                $(".accountNumberHint").html("请输入科目编号");
                $(".accountNumber").addClass("err");
            } else if (!$jsReg.justNum.test($(this).val())) {
                $(".accountNumberHint").html("只能是纯数字");
                $(".accountNumber").addClass("err");
            } else {
                $.ajax({
                    type: 'GET',
                    url: '/ucenter/general/finance/financeSubject/subjectCodeVerify.shtml?subjectCode=' + $(this).val(),
                    success: function(d) {
                        var $code = d.code,
                            $msg = d.msg,
                            $objects = d.objects;

                        if ($code === 'SUCCESS') {
                            parent.layer.msg($msg);
                        } else {
                            parent.layer.msg('查询科目编号是否有效失败！');
                        }
                    }
                });
            }
        });
        form.render()
    });
})