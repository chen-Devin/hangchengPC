$(function() {
    layui.use(['form', 'layer', 'layedit', 'laydate'], function() {
        var form = layui.form,
            layer = layui.layer,
            layedit = layui.layedit,
            laydate = layui.laydate,
            $ = layui.jquery;

        var $income = sessionStorage.getItem("accountReceived");
        var $expend = sessionStorage.getItem("accountHandle");
        var $parentId = sessionStorage.getItem("accountParentId");
        var $Id = sessionStorage.getItem("accountId");
        var $subjectCode = sessionStorage.getItem("accountCode") === 'null' ? '' : sessionStorage.getItem("accountCode");

        $('input[name="income"]').each(function() {
            if ($income == $(this).val()) {
                $(this).prop('checked', true);
            } else {
                $(this).prop('checked', false);
            }
        });

        $('input[name="expend"]').each(function() {
            if ($expend == $(this).val()) {
                $(this).prop('checked', true);
            } else {
                $(this).prop('checked', false);
            }
        });

        $('input[name="courseTitle"]').val(sessionStorage.getItem("accountName"));
        $('input[name="accountNumber"]').val($subjectCode);

        $.get('/ucenter/general/finance/financeSubject/getSubjectNameOrId.shtml?id=' + $Id, function(d) {
            var $code = d.code,
                $msg = d.msg,
                $objects = d.objects;
            if ($code === 'SUCCESS') {
                for (var $i = 0; $i < $objects.length; $i++) {
                    $objects[$i].id == $parentId ? $html = ' selected="selected"' : $html = '';
                    $('select[name="parentSubject"]').append('<option value="' + $objects[$i].id + '"' + $html + '>' + $objects[$i].subjectName + '</option>');
                }
                // console.log($parentId);
                form.render('select');
            } else {
                setLayerAlert(parent.layer, '获取信息失败');
                return false;
            }
        }, 'json');

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
                if ($subjectCode !== $(this).val()) {
                    $.ajax({
                        type: 'GET',
                        url: '/ucenter/general/finance/financeSubject/subjectCodeVerify.shtml?subjectCode=' + $(this).val(),
                        success: function(d) {
                            var $code = d.code,
                                $msg = d.msg,
                                $objects = d.objects;
                            parent.layer.msg($msg);
                        }
                    });
                }
            }
        });

        //监听提交
        form.on('submit(save)', function(data) {
            $('.save').blur();
            var objects = {
                subjectName: $.trim(data.field.courseTitle),
                parentId: $.trim(data.field.parentSubject),
                subjectCode: $.trim(data.field.accountNumber),
                id: $.trim($Id),
                hasReceived: $.trim(data.field.income),
                hasHandle: $.trim(data.field.expend)
            };
            //保存数据，调用接口
            $.ajax({
                type: 'PUT',
                url: '/ucenter/general/finance/financeSubject/' + $Id + '.shtml',
                dataType: "json",
                contentType: "application/json",
                data: JSON.stringify(objects),
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
            // return false;
        });

        form.render()
    });
})