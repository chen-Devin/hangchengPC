/*
* 注册控件
* terry zhong
* 2017-8-2
* v1.0
*/

// //获取路径参数
function getUrlParam(name){
  var reg = new RegExp("(^|&)"+ name +"=([^&]*)(&|$)");  
  var r = window.location.search.substr(1).match(reg);  
  if (r!=null) return unescape(r[2]);  
  return null;
}

//AJAX回调变量
var $ajax = {
    isUserName: false,
    isMobile: false
}
//已经注册的社会信用代码
var exixtSocialCode = {};
//已经注册的身份证号码
var exixtIDcard = {};
//第一步骤：注册
var regisitStep1 = function(){
  //定义元素
  var $regist = {
    userName: $('#username'),
    passWord: $('#password'),
    passWord1: $('#password1'),
    vcode: $('#vcode'),
    mobile: $('#mobile'),
    smsCode: $('#smscode'),
    inviteCode: $('#invitecode'),
    checkStatus: $('#checkstatus')
  }

  //表单验证
  var $verify = {
    //用户名
    userName: function($obj, $objVal, $txt){
      var $myreg = /^[A-Za-z0-9]+$/;
      if($objVal.length == 0){
        checkResult($obj, $txt.errorMsg1, 2);
        $ajax.isUserName = false;
        return false;
      }else if($objVal.length < 4 || $objVal.length > 20){
        checkResult($obj, $txt.errorMsg2, 2);
        $ajax.isUserName = false;
        return false;
      }else if(!$myreg.test($objVal)){
        checkResult($obj, $txt.errorMsg3, 2);
        $ajax.isUserName = false;
        return false;
      }else{
        //用户名是否唯一
        $.get('/register/checkAccid.shtml', {accid: $objVal}, function(d){
          var $code = d.code,
              $msg = d.msg,
              $objects = d.objects;
          //成功代码
          if($code === 'SUCCESS'){
            if($objects){
              checkResult($obj, '', 3);
              $ajax.isUserName = true;
              return true;
            }else{
              checkResult($obj, $txt.errorMsg4, 2);
              $ajax.isUserName = false;
              return false;
            }	          
          }else{
            checkResult($obj, $msg, 2);
            $ajax.isUserName = false;
            return false;
          }
        }, 'json');
      }
    },
    //登录密码
    passWord: function($obj, $objVal, $txt){
      var regNull=/(^\s*)|(\s*$)/g;
      var $myreg = /^[A-Za-z0-9]+$/;
      var atLeast = /^(?![^a-zA-Z]+$)(?!\D+$)/;
      if($objVal.length == 0){
        checkResult($obj, $txt.errorMsg1, 2);
        return false;
      }else if($objVal.length < 6 || $objVal.length > 20){
        checkResult($obj, $txt.errorMsg2, 2);
        return false;
      }else if(!$myreg.test($objVal) || !regNull.test($objVal)){
        checkResult($obj, $txt.errorMsg3, 2);
        return false;
      }else if(!atLeast.test($objVal)){
        checkResult($obj, "密码由大小写字母和数字两种以上组合", 2);
        return false;
      }else{
        checkResult($obj, '', 3);
        return true;
      }
    },
    //确认密码
    passWord1: function($obj, $objVal, $txt){
      var $myreg = /^[A-Za-z0-9]+$/;
      var $obj1 = $regist.passWord,
          $obj1Val = $.trim($obj1.val());
      if($objVal.length == 0){
        checkResult($obj, $txt.errorMsg1, 2);
        return false;
      }else if($objVal.length < 6 || $objVal.length > 20){
        checkResult($obj, $txt.errorMsg2, 2);
        return false;
      }else if(!$myreg.test($objVal)){
        checkResult($obj, $txt.errorMsg3, 2);
        return false;
      }else if($obj1Val != $objVal){
        checkResult($obj, $txt.errorMsg4, 2);
        return false;
      }else{
        checkResult($obj, '', 3);
        return true;
      }
    },
    //图片验证码
    vcode: function($obj, $objVal, $txt){
      if($objVal.length == 0){
        checkResult($obj, $txt.errorMsg1, 2);
        return false;
      }else{
        checkResult($obj, '', 3);
        return true;
      }
    },
    //手机号码
    mobile: function($obj, $objVal, $txt){
      $("#check-sms").removeClass("btn-active");
      var $myreg = /^1[34578]\d{9}$/;
      // var $myreg = /^(((13[0-9]{1})|(15[0-9]{1})|(18[0-9]{1}))+\d{8})$/;
      if($objVal.length == 0){
        checkResult($obj, $txt.errorMsg1, 2);
        $ajax.isMobile = false;
        return false;
      }else if(isNaN($objVal) || !$myreg.test($objVal) || $objVal.length != 11){
        checkResult($obj, $txt.errorMsg2, 2);
        $ajax.isMobile = false;      
        return false;
      }else{
        checkResult($obj, '', 3);
        $ajax.isMobile = true;
        if($("#check-sms").data("sms") !== "sending"){
          $("#check-sms").addClass("btn-active");
        }       
        return true;
      }
      // }else{
      //   //手机号是否唯一
      //   $.get('/register/checkMobile.shtml', {mobile: $objVal}, function(d){
      //     var $code = d.code,
      //         $msg = d.msg,
      //         $objects = d.objects;
      //     //成功代码
      //     if($code === 'SUCCESS'){
      //       if($objects){
      //         checkResult($obj, '', 3);
      //         $ajax.isMobile = true;
      //         return true;
      //       }else{
      //         checkResult($obj, $txt.errorMsg3, 2);
      //         $ajax.isMobile = false;
      //         return false;
      //       }	          
      //     }else{
      //       checkResult($obj, $msg, 2);
      //       $ajax.isMobile = false;
      //       return false;
      //     }
      //   }, 'json');
      // }
    },
    //短信验证码
    smsCode: function($obj, $objVal, $txt){
      if($objVal.length == 0){
        checkResult($obj, $txt.errorMsg1, 2);
        return false;
      }else if(isNaN($objVal)){
        checkResult($obj, $txt.errorMsg2, 2);
        return false;
      }else{
        checkResult($obj, '', 3);
        return true;
      }
    },
    //注册邀请码
    inviteCode: function($obj, $objVal, $txt){
      return true;
      var $myreg = /^[A-Za-z0-9]+$/;
      if($objVal.length > 0){
        if($objVal.length != 6){
          checkResult($obj, $txt.errorMsg1, 2);
          return false;
        }else if(!$myreg.test($objVal)){
          checkResult($obj, $txt.errorMsg2, 2);
          return false;
        }else{
          checkResult($obj, '', 3);
          return true;
        }
      }else{
        checkResult($obj, '', 3);
        return true;
      }
    }
  }

  //焦点事件
  var $focus = {
    //用户名
    userName: function($obj, $txt){
      $obj.on('focus', function(){
        checkResult($(this), $txt.normMsg, 1);
      });
      $obj.on('blur', function(){
        var $objVal = $.trim($(this).val());
            $verify.userName($(this), $objVal, $txt);
      });
    },
    //登录密码
    passWord: function($obj, $txt){
      $obj.on('focus', function(){
        checkResult($(this), $txt.normMsg, 1);
      });
      $obj.on('blur', function(){
        var $objVal = $(this).val();
            $verify.passWord($(this), $objVal, $txt);
      });
    },
    //确认密码
    passWord1: function($obj, $txt){
      $obj.on('focus', function(){
        checkResult($(this), $txt.normMsg, 1);
      });
      $obj.on('blur', function(){
        var $objVal = $(this).val();
            $verify.passWord1($(this), $objVal, $txt);
      });
    },
    //图片验证码
    vcode: function($obj, $txt){
      $obj.on('focus', function(){
        checkResult($(this), $txt.normMsg, 1);
      });
      $obj.on('blur', function(){
        var $objVal = $.trim($(this).val());
            $verify.vcode($(this), $objVal, $txt);
      });
    },
    //手机号码
    mobile: function($obj, $txt){
      $obj.on('focus', function(){
        checkResult($(this), $txt.normMsg, 1);
      });
      $obj.on('blur  input propertychange', function(){
        var $objVal = $.trim($(this).val());
            $verify.mobile($(this), $objVal, $txt);
      });
    },
    //短信验证码
    smsCode: function($obj, $txt){
      $obj.on('focus', function(){
        checkResult($(this), $txt.normMsg, 1);
      });
      $obj.on('blur', function(){
        var $objVal = $.trim($(this).val());
            $verify.smsCode($(this), $objVal, $txt);
      });
    },
    //注册邀请码
    inviteCode: function($obj, $txt){
      $obj.on('focus', function(){
        checkResult($(this), $txt.normMsg, 1);
      });
      $obj.on('blur', function(){
        var $objVal = $.trim($(this).val());
            $verify.inviteCode($(this), $objVal, $txt);
      });
    }
  }

  $focus.userName($regist.userName, $jsLang.userName);
  $focus.passWord($regist.passWord, $jsLang.passWord);
  $focus.passWord1($regist.passWord1, $jsLang.passWord1);
  $focus.vcode($regist.vcode, $jsLang.vcode);
  $focus.mobile($regist.mobile, $jsLang.mobile);
  $focus.smsCode($regist.smsCode, $jsLang.smsCode);
  $focus.inviteCode($regist.inviteCode, $jsLang.inviteCode);

  /**
   * 刷新图片验证码
   * @param target  设置图片验证码的dom元素或者jq选择器
   */
  var refreshValidateCode = function(target){
    $(target).attr('src', '/valicode.shtml?' + Math.random());
  }

  $('#vcodeImg, #check-vcode').click(function(){
    refreshValidateCode('#vcodeImg');
  });

  //获取短信验证码
  $('#form-regist').off().on('click', '.btn-active', function(){
    sendSms();
  });
  
  //图片验证码校验，手机发送验证码
  function sendSms(){
    checkResult($regist.smsCode, '', 3);
    var $userName = $regist.userName,
        $passWord = $regist.passWord,
        $passWord1 = $regist.passWord1,
        $vcode = $regist.vcode,
        $mobile = $regist.mobile,
        $userNameVal = $.trim($userName.val()),
        $passWordVal = $.trim($passWord.val()),
        $passWord1Val = $.trim($passWord1.val()),
        $vcodeVal = $.trim($vcode.val()),
        $mobileVal = $.trim($mobile.val());
    $verify.userName($userName, $userNameVal, $jsLang.userName);
    if(!$ajax.isUserName) return false;
    var $isPassWord = $verify.passWord($passWord, $passWordVal, $jsLang.passWord);
    if(!$isPassWord) return false;
    var $isPassWord1 = $verify.passWord1($passWord1, $passWord1Val, $jsLang.passWord1);
    if(!$isPassWord1) return false;
    var $isVcode = $verify.vcode($vcode, $vcodeVal, $jsLang.vcode);
    if(!$isVcode) return false;
    $verify.mobile($mobile, $mobileVal, $jsLang.mobile);
    if(!$ajax.isMobile) return false;
    if($cutTime > 0 && $cutTime < 120){return false;}
    
    $.post('/register/sendSMS.shtml', {vcode: $vcodeVal, mobile: $mobileVal}, function(d){
      var $code = d.code,
          $msg = d.msg,
          $objects = d.objects;

      if($code === 'SUCCESS'){
        getSms($('#check-sms'));
        $("#check-sms").data("sms","sending").removeClass("btn-active"); 
      }else if($code === 'ERROR_IMG_VALIDATE_CODE'){
        checkResult($regist.vcode, $msg, 2);
        $('#vcodeImg').attr('src', '/valicode.shtml?' + Math.random());
        return false;
      }else{
        checkResult($regist.smsCode, $jsLang.smsCode.errorMsg3, 2);
        return false;
      }

    }, 'json');
  }

  //短信验证码倒计时
  var $cutTime = 120;
  function getSms($obj){
    if($cutTime == 0){
      $obj.html('获取短信验证码');
      $("#check-sms").removeData("sms");
      $verify.mobile($regist.mobile, $.trim($regist.mobile.val()), $jsLang.mobile);
      $cutTime = 120;
      return;
    }else{
      $obj.html('重新发送<i>（' + $cutTime + '）</i>');
      $cutTime--;
    }
    setTimeout(function(){getSms($obj)}, 1000);
  }

  //表单提交
  $('.form-submit').on('click', function(){
    return checkForm();
  });

  //回车提交
  $("#form-regist").keydown(function(e){
    var e = e || event,
    keycode = e.which || e.keyCode;
    if (keycode==13) {
      return checkForm();
    }
  });

  //提交
  function checkForm(){
    var $userName = $regist.userName,
        $passWord = $regist.passWord,
        $passWord1 = $regist.passWord1,
        $vcode = $regist.vcode,
        $mobile = $regist.mobile,
        $smsCode = $regist.smsCode,
        $inviteCode = $regist.inviteCode,
        $userNameVal = $.trim($userName.val()),
        $passWordVal = $.trim($passWord.val()),
        $passWord1Val = $.trim($passWord1.val()),
        $vcodeVal = $.trim($vcode.val()),
        $mobileVal = $.trim($mobile.val()),
        $smsCodeVal = $.trim($smsCode.val()),
        $inviteCodeVal = $.trim($inviteCode.val());
    $verify.userName($userName, $userNameVal, $jsLang.userName);
    if(!$ajax.isUserName) return false;
    var $isPassWord = $verify.passWord($passWord, $passWordVal, $jsLang.passWord);
    if(!$isPassWord) return false;
    var $isPassWord1 = $verify.passWord1($passWord1, $passWord1Val, $jsLang.passWord1);
    if(!$isPassWord1) return false;
    var $isVcode = $verify.vcode($vcode, $vcodeVal, $jsLang.vcode);
    if(!$isVcode) return false;
    $verify.mobile($mobile, $mobileVal, $jsLang.mobile);
    if(!$ajax.isMobile) return false;
    var $isSmsCode = $verify.smsCode($smsCode, $smsCodeVal, $jsLang.smsCode);
    if(!$isSmsCode) return false;
    var $isInviteCode = $verify.inviteCode($inviteCode, $inviteCodeVal, $jsLang.inviteCode);
    if(!$isInviteCode) return false;
    if(!$regist.checkStatus.is(':checked')){
      checkResult($regist.checkStatus.parent(), $jsLang.checkStatus.errorMsg1, 2);
      return false;
    }else{
      checkResult($regist.checkStatus.parent(), '', 3);
    }
    
    var saveData = {
      accid: $userNameVal,
      accpwd: $passWordVal,
      mobile: $mobileVal,
      vcode: $smsCodeVal,
      invitationCode: $inviteCodeVal
    }
    $.ajax({
      type:"POST", 
      url:"/register/stepOne.shtml", 
      dataType:"json",      
      contentType:"application/json",               
      data:JSON.stringify(saveData), 
      success:function(d){
        var $code = d.code,
            $msg = d.msg,
            $objects = d.objects;
            
        if($code === 'SUCCESS'){
          $.cookie('mobile', $mobileVal, {expires: 30});
          window.location.href = 'register2-1.html';
        }else if($code === 'ERROR_SMS_VALIDATE_CODE'){
          //短信验证码不正确
          checkResult($smsCode, $jsLang.smsCode.errorMsg3, 2);
          return false;
        }else if($code === 'ERROR_QUICK_OPERATION'){
          alert('请勿频繁操作！');
          return false;
        }else{
          alert('注册失败，请重新注册！');
          return false;
        }
      }
    });
  }
}

//第二步骤：企业
var regisitStep2_1 = function(){
  //定义元素
  var $regist = {
    socialCode: $('#socialCode'),
    companyFullName: $('#companyFullName'),
    companyShortName: $('#companyShortName'),
    province: $('#province'),
    city: $('#city'),
    county: $('#county'),
    street: $('#street'),
    areaId: $('#areaId'),
    address: $('#address'),
    dateB: $('#dateB'),
    dateE: $('#dateE'),
    imgUrl: $('#imgUrl'),
    businessRole: $('#businessRole'),
    businessScope: $('#businessScope'),
    trueName: $('#trueName'),
    mobile: $('#mobile'),
    email: $('#email')
  }

  //表单验证
  var $verify = {
    //统一社会信用代码
    socialCode: function($obj, $objVal, $txt){
      var $myreg = $jsReg.unifyCode;
      if($objVal.length == 0){
        checkResult($obj, $txt.errorMsg1, 2);
        return false;
      }else if($objVal.length != 18){
        checkResult($obj, $txt.errorMsg2, 2);
        return false;
      }else if(!$myreg.test($objVal)){
        checkResult($obj, $txt.errorMsg3, 2);
        return false;
      }else{
        checkResult($obj, '', 3);
        return true;
      }
    },
    //只包含特殊字符_和-和#
    onlySpecialCharacters: function(str){
      var _reg  = /^([-]|[_]|[#])+$/;
      if(_reg.test(str)){
        return true;
      }
      return false;
    },
    //公司名称
    companyFullName: function($obj, $objVal, $txt){
      var $myreg = /^[\u4E00-\u9FA50-9A-Za-z()（）\-_#]+$/;     
      if($objVal.length == 0){
        checkResult($obj, $txt.errorMsg1, 2);
        return false;
      }else if($objVal.length < 2 || $objVal.length > 50){
        checkResult($obj, $txt.errorMsg2, 2);
        return false;
      }else if(!$myreg.test($objVal) || $verify.onlySpecialCharacters($objVal)){
        checkResult($obj, $txt.errorMsg3, 2);
        return false;
      }else{
        checkResult($obj, '', 3);
        return true;
      }
    },
    //公司简称
    companyShortName: function($obj, $objVal, $txt){
      var $myreg = /^[\u4E00-\u9FA50-9A-Za-z()（）\-_#]+$/;
      if($objVal.length == 0){
        checkResult($obj, $txt.errorMsg1, 2);
        return false;
      }else if($objVal.length < 2 || $objVal.length > 20){
        checkResult($obj, $txt.errorMsg2, 2);
        return false;
      }else if(!$myreg.test($objVal) || $verify.onlySpecialCharacters($objVal)){
        checkResult($obj, $txt.errorMsg3, 2);
        return false;
      }else{
        checkResult($obj, '', 3);
        return true;
      }
    },
    //选择城市
    district: function($obj, $txt){
      var $index = 3 - $('#district').find('select:hidden').length;
      var $indexVal = $('#district').find('select').eq($index).val();
      $obj.val($indexVal);
      var $objVal = $.trim($obj.val());
      if($objVal.length == 0){
        checkResult($obj, $txt.errorMsg1, 2);
        return false;
      }else{
        checkResult($obj, '', 3);
        return true;
      }
    },
    //详细地址
    address: function($obj, $objVal, $txt){
      var $myreg = /^[\u4E00-\u9FA50-9A-Za-z()（）\-_#]+$/;
      if($objVal.length == 0){
        checkResult($obj, $txt.errorMsg1, 2);
        return false;
      }else if($objVal.length < 5 || $objVal.length > 120){
        checkResult($obj, $txt.errorMsg2, 2);
        return false;
      }else if(!$myreg.test($objVal) || $verify.onlySpecialCharacters($objVal)){
        checkResult($obj, $txt.errorMsg3, 2);
        return false;
      }else{
        checkResult($obj, '', 3);
        return true;
      }
    },
    //营业期限
    deadline: function($obj, $txt){
      var $bVal = $.trim($('#dateB').val());
          $eVal = $.trim($('#dateE').val());
      if($bVal.length == 0 || $eVal.length == 0){
        checkResult($obj, $txt.errorMsg1, 2);
        return false;
      }else if(Date.parse(new Date($bVal)) - Date.parse(new Date($eVal)) > 0){
        checkResult($obj, "开始时间不能大于结束时间", 2);
        return false;
      }else{
        checkResult($obj, '', 3);
        return true;
      }
    },
    //图片上传
    imgUrl: function($obj, $objVal, $txt){
      if($objVal.length == 0){
        checkResult($obj, $txt.errorMsg1, 2);
        return false;
      }else{
        checkResult($obj, '', 3);
        return true;
      }
    },
    //业务角色
    businessRole: function($obj, $objVal, $txt){
      if($objVal.length == 0){
        checkResult($obj, $txt.errorMsg1, 2);
        return false;
      }else{
        checkResult($obj, '', 3);
        return true;
      }
    },
    //业务范围
    businessScope: function($obj, $objVal, $txt){
      if($objVal.length == 0){
        checkResult($obj, $txt.errorMsg1, 2);
        return false;
      }else{
        checkResult($obj, '', 3);
        return true;
      }
    },
    //注册人姓名
    trueName: function($obj, $objVal, $txt){
      //var $myreg = /^[\u4E00-\u9FA50-9A-Za-z]+$/;
      var $myreg = $jsReg.zhName;
      if($objVal.length == 0){
        checkResult($obj, $txt.errorMsg1, 2);
        return false;
      }else if($objVal.length < 2 || $objVal.length > 10){
        checkResult($obj, $txt.errorMsg2, 2);
        return false;
      }else if(!$myreg.test($objVal)){
        checkResult($obj, $txt.errorMsg2, 2);
        return false;
      }else{
        checkResult($obj, '', 3);
        return true;
      }
    },
    //邮箱
    email: function($obj, $objVal, $txt){
      var $myreg = /^(\w-*\.*)+@(\w-?)+(\.\w{2,})+$/;
      if($objVal.length > 0){
        if(!$myreg.test($objVal)){
          checkResult($obj, $txt.errorMsg1, 2);
          return false;
        }else{
          checkResult($obj, '', 3);
          return true;
        }
      }else{
        checkResult($obj, '', 3);
        return true;
      }
    }
  }

  //焦点事件
  var $focus = {
    //统一社会代码
    socialCode: function($obj, $txt){
      $obj.on('focus', function(){
        checkResult($(this), $txt.normMsg, 1);
      });
      $obj.on('blur', function(){
        var $objVal = $.trim($(this).val());
            $verify.socialCode($(this), $objVal, $txt);
        
        var $isV = $verify.socialCode($(this), $objVal, $txt);
            if($isV) validateSocialCode($objVal);
      });
    },
    //公司名称
    companyFullName: function($obj, $txt){
      $obj.on('focus', function(){
        checkResult($(this), $txt.normMsg, 1);
      });
      $obj.on('blur', function(){
        var $objVal = $.trim($(this).val());
            $verify.companyFullName($(this), $objVal, $txt);
      });
    },
    //公司简称
    companyShortName: function($obj, $txt){
      $obj.on('focus', function(){
        checkResult($(this), $txt.normMsg, 1);
      });
      $obj.on('blur', function(){
        var $objVal = $.trim($(this).val());
            $verify.companyShortName($(this), $objVal, $txt);
      });
    },
    //详细地址
    address: function($obj, $txt){
      $obj.on('focus', function(){
        checkResult($(this), $txt.normMsg, 1);
      });
      $obj.on('blur', function(){
        var $objVal = $.trim($(this).val());
            $verify.address($(this), $objVal, $txt);
      });
    },
    //业务角色
    businessRole: function($obj, $txt){
      $obj.on('change', function(){
        var $objVal = $.trim($(this).val());
            $verify.businessRole($(this), $objVal, $txt);
      });
    },
    //业务范围
    businessScope: function($obj, $txt){
      $obj.on('focus', function(){
        checkResult($(this), $txt.normMsg, 1);
      });
      $obj.on('blur', function(){
        var $objVal = $.trim($(this).val());
            $verify.businessScope($(this), $objVal, $txt);
      });
    },
    //注册人姓名
    trueName: function($obj, $txt){
      $obj.on('focus', function(){
        checkResult($(this), $txt.normMsg, 1);
      });
      $obj.on('blur', function(){
        var $objVal = $.trim($(this).val());
            $verify.trueName($(this), $objVal, $txt);
      });
    },
    //邮箱验证
    email: function($obj, $txt){
      $obj.on('focus', function(){
        checkResult($(this), $txt.normMsg, 1);
      });
      $obj.on('blur', function(){
        var $objVal = $.trim($(this).val());
            $verify.email($(this), $objVal, $txt);
      });
    }
  }

  $focus.socialCode($regist.socialCode, $jsLang.socialCode);
  $focus.companyFullName($regist.companyFullName, $jsLang.companyFullName);
  $focus.companyShortName($regist.companyShortName, $jsLang.companyShortName);
  $focus.address($regist.address, $jsLang.address);
  $focus.businessRole($regist.businessRole, $jsLang.businessRole);
  $focus.trueName($regist.trueName, $jsLang.trueName);
  $focus.email($regist.email, $jsLang.email);

  var $rbId = getUrlParam('rbId');
      if($rbId == null) $rbId = '';

  //表单提交
  $('.form-submit').on('click', function(){
    validateSocialCode($.trim($regist.socialCode.val()),"submit");
    //return checkForm();
  });

  //提交
  function checkForm(){
    var $isSocialCode = $verify.socialCode($regist.socialCode, $.trim($regist.socialCode.val()), $jsLang.socialCode);
    if(!$isSocialCode) return false;
    var $isCompanyFullName = $verify.companyFullName($regist.companyFullName, $.trim($regist.companyFullName.val()), $jsLang.companyFullName);
    if(!$isCompanyFullName) return false;
    var $isCompanyShortName = $verify.companyShortName($regist.companyShortName, $.trim($regist.companyShortName.val()), $jsLang.companyShortName);
    if(!$isCompanyShortName) return false;
    var $isDistrict = $verify.district($('#areaId'), $jsLang.district);
    if(!$isDistrict) return false;
    var $isAddress = $verify.address($regist.address, $.trim($regist.address.val()), $jsLang.address);
    if(!$isAddress) return false;
    var $isDeadline = $verify.deadline($('#deadline'), $jsLang.deadline);
    if(!$isDeadline) return false;
    var $isImgUrl = $verify.imgUrl($regist.imgUrl, $.trim($regist.imgUrl.val()), $jsLang.imgUrl);
    if(!$isImgUrl) return false;
    var $isBusinessRole = $verify.businessRole($regist.businessRole, $.trim($regist.businessRole.val()), $jsLang.businessRole);
    if(!$isBusinessRole) return false;
    var $isBusinessScope = $verify.businessScope($regist.businessScope, $.trim($regist.businessScope.val()), $jsLang.businessScope);
    if(!$isBusinessScope) return false;
    var $isTrueName = $verify.trueName($regist.trueName, $.trim($regist.trueName.val()), $jsLang.trueName);
    if(!$isTrueName) return false;
    var $isEmail = $verify.email($regist.email, $.trim($regist.email.val()), $jsLang.email);
    if(!$isEmail) return false;

    var $scopeArr = [];
        $scopeArr = $.trim($regist.businessScope.val()).split(',');

    var $imgStr = $.trim($regist.imgUrl.val());
    var $imgLast = $imgStr.substr($imgStr.length - 1, $imgStr.length);
    if($imgLast == ','){
      $imgStr = $imgStr.substr(0, $imgStr.length - 1);
    }

    var saveData = {
      id: $rbId,
      bodyType: "1",
      usc: $.trim($regist.socialCode.val()),
      coName: $.trim($regist.companyFullName.val()),
      coNameShort: $.trim($regist.companyShortName.val()),
      regAreaId: $.trim($('#areaId').val()),
      regAddress: $.trim($regist.address.val()),
      busnissTimeB: new Date($.trim($regist.dateB.val())).getTime(),
      busnissTimeE: new Date($.trim($regist.dateE.val())).getTime(),
      businessLicenseAffix: $imgStr,
      businessWorker: $.trim($regist.businessRole.val()),
      businessScope: $scopeArr,
      linkman: $.trim($regist.trueName.val()),
      linkmanMobile: $.trim($('#mobile').val()),
      linkmanEmail: $.trim($regist.email.val())
    }
    
    $.ajax({
      type:"POST", 
      url:"/register/stepTwo.shtml", 
      dataType:"json",      
      contentType:"application/json",               
      data:JSON.stringify(saveData), 
      success:function(d){
        var $code = d.code,
            $msg = d.msg,
            $objects = d.objects;
            
        if($code === 'SUCCESS'){
          window.location.href = 'register3.html';
        }else if($code === 'ERROR_COMPANY_EXIST'){
          checkResult($regist.socialCode, $msg, 2);
          return false;
        }else if($code === 'ERROR_COMPANY_AUDITED'){
          checkResult($regist.idCard, $msg, 2);
          return false;
        }else if($code === 'ERROR_USER_NOT_EXIST'){
          alert('你还未注册账户，请去注册！');
          window.location.href = 'index.html';
          return false;
        }else{
          alert('填写信息失败，请重新填写！');
          return false;
        }
      }
    });
  }

  //获取企业信息
  if($rbId != ''){
    $('.cut_btn').hide();
    $.get('/ucenter/centre/permi/company/' + $rbId + '.shtml', function(d){
      var $code = d.code,
          $msg = d.msg,
          $objects = d.objects;

      if($code === 'SUCCESS'){
        if($objects.regBodyStatus === 'NOT_PASS'){
          $('#no-pass').show();
        }else{
          logout();
        }
        $regist.socialCode.val($objects.usc);
        $regist.companyFullName.val($objects.coName);
        $regist.companyShortName.val($objects.coNameShort);
        $regist.areaId.val($objects.regAreaId);
        $('#district').district($objects.regAreaId);
        $regist.address.val($objects.regAddress);
        var $nDateB = new Date($objects.busnissTimeB);
        var $nDateE = new Date($objects.busnissTimeE);
        $regist.dateB.val($nDateB.format('yyyy-MM-dd'));
        $regist.dateE.val($nDateE.format('yyyy-MM-dd'));
        
        if($objects.businessLicenseAffix.length > 0){
          $regist.imgUrl.val($objects.businessLicenseAffix);
          var $imgArr = $objects.businessLicenseAffix.split(',');
          for(var k = 0; k < $imgArr.length; k++){
            $('#upload-btn').html('重新上传');
            $('#upload-imgs').html('<a href="/ucenter/download/' + $imgArr[k] + '.shtml" target="_blank"><img src="/ucenter/download/' + $imgArr[k] + '.shtml" alt="'+ $imgArr[k] +'" class="layui-upload-img"></a>');
          }
        }

        $regist.businessRole.val($objects.businessWorker);
        $regist.businessScope.val($objects.businessScope.join(','));
        getBusinessData($objects.businessWorker.toString(), $objects.businessScope);
        $regist.trueName.val($objects.linkman);
        $regist.mobile.val($objects.linkmanMobile);
        $regist.email.val($objects.linkmanEmail);
      }else if($code === 'ERROR_USER_LOGOFF'){
        alert('你还未登录或未注册，请返回！');
        window.location.href = '/';
      }else if($code === 'ERROR_NOT_EXIST'){
        alert('信息不存在！');
        window.location.href = '/';
      }else{
        alert('数据异常，请联系管理员！');
        return false;
      }
    }, 'json');
  }else{
    //return; // 测试  要删除的
    if(typeof $.cookie('mobile') != 'undefined'){
      if($.cookie('mobile').length == 0){
        window.location.href = 'index.html';
      }else{
        $regist.mobile.val($.cookie('mobile'));
      }
    }else{
      window.location.href = 'index.html';
    }
    $('#district').district();
    getBusinessData();
  }

  //判断社会信用代码注册过没有
  function validateSocialCode($val,type){
    if(exixtSocialCode[$val] === "exixt"){
      checkResult($("#socialCode"), "统一社会代码已被使用", 2);     
      return false;
    }

    if(exixtSocialCode[$val] === "wronwgful"){
      checkResult($("#socialCode"), "统一社会代码格式不正确", 2);     
      return false;
    }

    $.get('/register/checkUsedUSC.shtml', {id: "", usc: $val}, function(d){
      if(d.code == "SUCCESS"){
        if(type == "submit"){
          checkForm();
        }else{
          getCompanyData($val);
        } 
      }else{
        if(d.code == "ERROR_USC_USED"){
          checkResult($("#socialCode"), d.msg || "统一社会代码已被使用", 2);     
          exixtSocialCode[$val] = "exixt";
  
        }else if(d.code == "ERROR_ILLEGAL_ARGUMENT"){
          checkResult($("#socialCode"), "统一社会代码格式不正确", 2);     
          exixtSocialCode[$val] = "wronwgful";

        }else{
          checkResult($("#socialCode"), d.msg, 2); 
        }
      }
      
    }, 'json');
  }

 //判断库里有没有这个社会信用代码，有的话填充
  function getCompanyData($val){  
    $.get('/ucenter/standard/common/companyStandard/getCompanyByUsc.shtml', {usc: $val}, function(d){
      var $code = d.code,
          $msg = d.msg,
          $objects = d.objects;

      if($code === 'SUCCESS'){
        if($objects != null){
          $regist.companyFullName.val($objects.coName);
          $regist.companyShortName.val($objects.coNameShort);
          $regist.areaId.val($objects.companyAreaId);
          $('#district').district($objects.companyAreaId);
          $regist.address.val($objects.companyAddress);
        }else{
          $regist.companyFullName.val('');
          $regist.companyShortName.val('');
          $regist.areaId.val('');
          $('#district').district();
          $regist.address.val('');
        }
      }
    }, 'json');
  }

}

//第二步骤：个人
var regisitStep2_2 = function(){
  //定义元素
  var $regist = {
    idCard: $('#idCard'),
    zhName: $('#zhName'),
    province: $('#province'),
    city: $('#city'),
    county: $('#county'),
    street: $('#street'),
    areaId: $('#areaId'),
    address: $('#address'),
    imgUrl1: $('#imgUrl1'),
    imgUrl2: $('#imgUrl2'),
    businessRole: $('#businessRole'),
    businessScope: $('#businessScope'),
    trueName: $('#trueName'),
    mobile: $('#mobile'),
    email: $('#email')
  }

  //表单验证
  var $verify = {
    //身份证号码
    idCard: function($obj, $objVal, $txt){
      //var $myreg = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
      var $myreg = $jsReg.idNo;
      if($objVal.length == 0){
        checkResult($obj, $txt.errorMsg1, 2);
        return false;
      }else if(!$myreg.test($objVal)){
        checkResult($obj, $txt.errorMsg2, 2);
        return false;
      }else{
        checkResult($obj, '', 3);
        return true;
      }
    },
    //姓名
    zhName: function($obj, $objVal, $txt){
      var $myreg = /^[\u4E00-\u9FA50-9A-Za-z()（）\-_]+$/;
      if($objVal.length == 0){
        checkResult($obj, $txt.errorMsg1, 2);
        return false;
      }else if($objVal.length < 2 || $objVal.length > 10){
        checkResult($obj, $txt.errorMsg2, 2);
        return false;
      }else if(!$myreg.test($objVal)){
        checkResult($obj, $txt.errorMsg2, 2);
        return false;
      }else{
        checkResult($obj, '', 3);
        return true;
      }
    },
    //选择城市
    district: function($obj, $txt){
      var $index = 3 - $('#district').find('select:hidden').length;
      var $indexVal = $('#district').find('select').eq($index).val();
      $obj.val($indexVal);
      var $objVal = $.trim($obj.val());
      if($objVal.length == 0){
        checkResult($obj, $txt.errorMsg1, 2);
        return false;
      }else{
        checkResult($obj, '', 3);
        return true;
      }
    },
    //详细地址
    address: function($obj, $objVal, $txt){
      var $myreg = /^[\u4E00-\u9FA50-9A-Za-z()（）\-_#]+$/;
      var _reg  = /^([-]|[_]|[#])+$/;
      if($objVal.length == 0){
        checkResult($obj, $txt.errorMsg1, 2);
        return false;
      }else if($objVal.length < 5 || $objVal.length > 120){
        checkResult($obj, $txt.errorMsg2, 2);
        return false;
      }else if(!$myreg.test($objVal) || _reg.test($objVal)){
        checkResult($obj, $txt.errorMsg3, 2);
        return false;
      }else{
        checkResult($obj, '', 3);
        return true;
      }
    },
    //正面图片上传
    imgUrl1: function($obj, $objVal, $txt){
      if($objVal.length == 0){
        checkResult($obj, $txt.errorMsg1, 2);
        return false;
      }else{
        checkResult($obj, '', 3);
        return true;
      }
    },
    //反面图片上传
    imgUrl2: function($obj, $objVal, $txt){
      if($objVal.length == 0){
        checkResult($obj, $txt.errorMsg1, 2);
        return false;
      }else{
        checkResult($obj, '', 3);
        return true;
      }
    },
    //业务角色
    businessRole: function($obj, $objVal, $txt){
      if($objVal.length == 0){
        checkResult($obj, $txt.errorMsg1, 2);
        return false;
      }else{
        checkResult($obj, '', 3);
        return true;
      }
    },
    //业务范围
    businessScope: function($obj, $objVal, $txt){
      if($objVal.length == 0){
        checkResult($obj, $txt.errorMsg1, 2);
        return false;
      }else{
        checkResult($obj, '', 3);
        return true;
      }
    },
    //注册人姓名
    trueName: function($obj, $objVal, $txt){
      var $myreg = /^[\u4E00-\u9FA50-9A-Za-z]+$/;
      if($objVal.length == 0){
        checkResult($obj, $txt.errorMsg1, 2);
        return false;
      }else if($objVal.length < 2 || $objVal.length > 10){
        checkResult($obj, $txt.errorMsg2, 2);
        return false;
      }else if(!$myreg.test($objVal)){
        checkResult($obj, $txt.errorMsg2, 2);
        return false;
      }else{
        checkResult($obj, '', 3);
        return true;
      }
    },
    //邮箱
    email: function($obj, $objVal, $txt){
      var $myreg = /^(\w-*\.*)+@(\w-?)+(\.\w{2,})+$/;
      if($objVal.length > 0){
        if(!$myreg.test($objVal)){
          checkResult($obj, $txt.errorMsg1, 2);
          return false;
        }else{
          checkResult($obj, '', 3);
          return true;
        }
      }else{
        checkResult($obj, '', 3);
        return true;
      }
    }
  }

  //焦点事件
  var $focus = {
    //身份证号码
    idCard: function($obj, $txt){
      $obj.on('focus', function(){
        checkResult($(this), $txt.normMsg, 1);
      });
      $obj.on('blur', function(){
        var $objVal = $.trim($(this).val());
            $verify.idCard($(this), $objVal, $txt);

        var $isV = $verify.idCard($(this), $objVal, $txt);
            if($isV) validateIDcard($objVal);
      });
    },
    //姓名
    zhName: function($obj, $txt){
      $obj.on('focus', function(){
        checkResult($(this), $txt.normMsg, 1);
      });
      $obj.on('blur', function(){
        var $objVal = $.trim($(this).val());
            $('#trueName').val($objVal);
            $verify.zhName($(this), $objVal, $txt);
      });
    },
    //详细地址
    address: function($obj, $txt){
      $obj.on('focus', function(){
        checkResult($(this), $txt.normMsg, 1);
      });
      $obj.on('blur', function(){
        var $objVal = $.trim($(this).val());
            $verify.address($(this), $objVal, $txt);
      });
    },
    //业务角色
    businessRole: function($obj, $txt){
      $obj.on('change', function(){
        var $objVal = $.trim($(this).val());
            $verify.businessRole($(this), $objVal, $txt);
      });
    },
    //业务范围
    businessScope: function($obj, $txt){
      $obj.on('focus', function(){
        checkResult($(this), $txt.normMsg, 1);
      });
      $obj.on('blur', function(){
        var $objVal = $.trim($(this).val());
            $verify.businessScope($(this), $objVal, $txt);
      });
    },
    //注册人姓名
    trueName: function($obj, $txt){
      $obj.on('focus', function(){
        checkResult($(this), $txt.normMsg, 1);
      });
      $obj.on('blur', function(){
        var $objVal = $.trim($(this).val());
            $verify.trueName($(this), $objVal, $txt);
      });
    },
    //邮箱验证
    email: function($obj, $txt){
      $obj.on('focus', function(){
        checkResult($(this), $txt.normMsg, 1);
      });
      $obj.on('blur', function(){
        var $objVal = $.trim($(this).val());
            $verify.email($(this), $objVal, $txt);
      });
    }
  }

  var $rbId = getUrlParam('rbId');
      if($rbId == null) $rbId = '';    

  $focus.idCard($regist.idCard, $jsLang.idCard);
  $focus.zhName($regist.zhName, $jsLang.trueName);
  $focus.address($regist.address, $jsLang.address);
  $focus.businessRole($regist.businessRole, $jsLang.businessRole);
  $focus.trueName($regist.trueName, $jsLang.trueName);
  $focus.email($regist.email, $jsLang.email);

  //表单提交
  $('.form-submit').on('click', function(){
    //return checkForm();
    validateIDcard($regist.idCard.val(), "submit");
  });

  //提交
  function checkForm(){
    var $isIdCard = $verify.idCard($regist.idCard, $.trim($regist.idCard.val()), $jsLang.idCard);
    if(!$isIdCard) return false;
    var $isZhName = $verify.zhName($regist.zhName, $.trim($regist.zhName.val()), $jsLang.trueName);
    if(!$isZhName) return false;
    var $isDistrict = $verify.district($('#areaId'), $jsLang.district);
    if(!$isDistrict) return false;
    var $isAddress = $verify.address($regist.address, $.trim($regist.address.val()), $jsLang.address);
    if(!$isAddress) return false;
    var $isImgUrl1 = $verify.imgUrl1($regist.imgUrl1, $.trim($regist.imgUrl1.val()), $jsLang.imgUrl1);
    if(!$isImgUrl1) return false;
    var $isImgUrl2 = $verify.imgUrl2($regist.imgUrl2, $.trim($regist.imgUrl2.val()), $jsLang.imgUrl2);
    if(!$isImgUrl2) return false;
    var $isBusinessRole = $verify.businessRole($regist.businessRole, $.trim($regist.businessRole.val()), $jsLang.businessRole);
    if(!$isBusinessRole) return false;
    var $isBusinessScope = $verify.businessScope($regist.businessScope, $.trim($regist.businessScope.val()), $jsLang.businessScope);
    if(!$isBusinessScope) return false;
    var $isTrueName = $verify.trueName($regist.trueName, $.trim($regist.trueName.val()), $jsLang.trueName);
    if(!$isTrueName) return false;
    var $isEmail = $verify.email($regist.email, $.trim($regist.email.val()), $jsLang.email);
    if(!$isEmail) return false;

    var $scopeArr = [];
        $scopeArr = $.trim($regist.businessScope.val()).split(',');

    var $imgStr = $.trim($regist.imgUrl1.val()) + ',' + $.trim($regist.imgUrl2.val());
    // var $imgLast = $imgStr.substr($imgStr.length - 1, $imgStr.length);
    // if($imgLast == ','){
    //   $imgStr = $imgStr.substr(0, $imgStr.length - 1);
    // }
    
    var saveData = {
      id: $rbId,
      bodyType: "0",
      usc: $.trim($regist.idCard.val()),
      coName: $.trim($regist.zhName.val()),
      coNameShort: $.trim($regist.zhName.val()),
      regAreaId: $.trim($('#areaId').val()),
      regAddress: $.trim($regist.address.val()),
      businessLicenseAffix: $imgStr,
      businessWorker: $.trim($regist.businessRole.val()),
      businessScope: $scopeArr,
      linkman: $.trim($regist.trueName.val()),
      linkmanMobile: $.trim($('#mobile').val()),
      linkmanEmail: $.trim($regist.email.val())
    }
    
    $.ajax({
      type:"POST", 
      url:"/register/stepTwo.shtml", 
      dataType:"json",      
      contentType:"application/json",               
      data:JSON.stringify(saveData), 
      success:function(d){
        var $code = d.code,
            $msg = d.msg,
            $objects = d.objects;
            
        if($code === 'SUCCESS'){
          window.location.href = 'register3.html';
        }else if($code === 'ERROR_COMPANY_EXIST'){
          checkResult($regist.idCard, $jsLang.idCard.errorMsg3, 2);
          return false;
        }else if($code === 'ERROR_COMPANY_AUDITED'){
          checkResult($regist.idCard, $jsLang.idCard.errorMsg4, 2);
          return false;
        }else if($code === 'ERROR_USER_NOT_EXIST'){
          alert('你还未注册账户，请去注册！');
          window.location.href = 'index.html';
          return false;
        }else{
          alert('填写信息失败，请重新填写！');
          return false;
        }
      }
    });
  }

  //获取个人信息
  if($rbId != ''){
    $('.cut_btn').hide();
    $.get('/ucenter/centre/permi/company/' + $rbId + '.shtml', function(d){
      var $code = d.code,
          $msg = d.msg,
          $objects = d.objects;

      if($code === 'SUCCESS'){
        if($objects.regBodyStatus === 'NOT_PASS'){
          $('#no-pass').show();
        }else{
          logout();
        }
        $regist.idCard.val($objects.usc);
        $regist.zhName.val($objects.coName);
        $regist.areaId.val($objects.regAreaId);
        $('#district').district($objects.regAreaId);
        $regist.address.val($objects.regAddress);
        
        if($objects.businessLicenseAffix.length > 0){
          var $imgArr = $objects.businessLicenseAffix.split(',');
          if($imgArr.length > 1){
            $regist.imgUrl1.val($imgArr[0]);
            $('#upload-btn1').html('重新上传正面');
            $('#upload-imgs1').html('<a href="/ucenter/download/' + $imgArr[0] + '.shtml" target="_blank"><img src="/ucenter/download/' + $imgArr[0] + '.shtml" alt="'+ $imgArr[0] +'" class="layui-upload-img"></a>');
            $regist.imgUrl2.val($imgArr[1]);
            $('#upload-btn2').html('重新上传反面');
            $('#upload-imgs2').html('<a href="/ucenter/download/' + $imgArr[1] + '.shtml" target="_blank"><img src="/ucenter/download/' + $imgArr[1] + '.shtml" alt="'+ $imgArr[1] +'" class="layui-upload-img"></a>');
          }else if($imgArr.length == 1){
            $regist.imgUrl1.val($imgArr[0]);
            $('#upload-btn1').html('重新上传正面');
            $('#upload-imgs1').html('<a href="/ucenter/download/' + $imgArr[0] + '.shtml" target="_blank"><img src="/ucenter/download/' + $imgArr[0] + '.shtml" alt="'+ $imgArr[0] +'" class="layui-upload-img"></a>');
          }          
        }

        $regist.businessRole.val($objects.businessWorker);
        $regist.businessScope.val($objects.businessScope.join(','));
        getBusinessData($objects.businessWorker.toString(), $objects.businessScope);
        $regist.trueName.val($objects.linkman);
        $regist.mobile.val($objects.linkmanMobile);
        $regist.email.val($objects.linkmanEmail);
      }else if($code === 'ERROR_USER_LOGOFF'){
        alert('你还未登录或未注册，请返回！');
        window.location.href = '/';
      }else if($code === 'ERROR_NOT_EXIST'){
        alert('信息不存在！');
        window.location.href = '/';
      }else{
        alert('数据异常，请联系管理员！');
        return false;
      }
    }, 'json');
  }else{
    //return;  //测试要删除
    if(typeof $.cookie('mobile') != 'undefined'){
      if($.cookie('mobile').length == 0){
        window.location.href = 'index.html';
      }else{
        $regist.mobile.val($.cookie('mobile'));
      }
    }else{
      window.location.href = 'index.html';
    }
    $('#district').district();
    getBusinessData();
  }

  
  //判断身份证注册过没有
  function validateIDcard($val,type){
    if(exixtIDcard[$val]){
      checkResult($("#idCard"), "身份证号码已被使用", 2);     
      return false;
    }
    $.get('/register/checkUsedUSC.shtml', {id: "", usc: $val}, function(d){
      if(d.code == "SUCCESS"){
        if(type == "submit"){
          checkForm();
        }else{
          getIdCardData($val);
        }  
      }else if(d.code == "ERROR_IDNUMBER_USED"){
        checkResult($("#idCard"), d.msg || "身份证号码已被使用", 2);     
        exixtIDcard[$val] = "exixt";
      }else{
        checkResult($("#idCard"), d.msg, 2);
      }
    }, 'json');
  }

  //身份证获取信息
  function getIdCardData($val){
    $.get('/ucenter/standard/common/employeeStandard/getEmployee.shtml', {idno: $val}, function(d){
      var $code = d.code,
          $msg = d.msg,
          $objects = d.objects;

      if($code === 'SUCCESS'){
        if($objects != null){
          $regist.zhName.val($objects.name);
          $regist.trueName.val($objects.name);
        }else{
          $regist.zhName.val('');
          $regist.trueName.val('');
        }
      }
    }, 'json');
  }

}

//第三步骤：成功
var regisitStep3 = function(){
  $.cookie('mobile', '');
  //页面跳转倒计时
  var $cutTime = 10;
      goUrl($('#sec'));

  function goUrl($obj){
    if($cutTime == 0){
      logout();
      return;
    }else{
      $obj.html($cutTime);
      $cutTime--;
    }
    setTimeout(function(){goUrl($obj)}, 1000);
  }
}

//焦点
function checkResult(obj, txt, type, isFocus){
  switch(type){
    case 1:
      obj.removeClass('error').addClass('active');
      obj.parent().find('.form-error').removeClass('check').text(txt);
      break;
    case 2:
      isFocus ? obj.focus() : '';
      obj.removeClass('active').addClass('error');
      obj.parent().find('.form-error').addClass('check').text(txt);
      break;
    case 3:
      obj.removeClass('active');
      obj.removeClass('error');
      obj.parent().find('.form-error').removeClass('check').text('');
      break;
  }
}

//获取业务角色和业务范围($val：当前企业业务角色id，$valArr:当前企业业务范围)
function getBusinessData($val, $valArr){
  $val = typeof $val != 'undefined' ? $val : '';
  $valArr = typeof $valArr != 'undefined' ? $valArr : '';
  $.get('/common/bussinessRole/roles.shtml', {"type" : String($(".panel-register").data("bodyType"))}, function(d){
    var $code = d.code,
        $msg = d.msg,
        $data = d.objects;

    if($data.length > 0){
      for(var i = 0; i < $data.length; i++){
        if(parseInt($val) == parseInt($data[i].id)){
          $('#businessRole').append('<option value="' + $data[i].id + '" selected="selected">' + $data[i].name + '</option>');
        }else{
          $('#businessRole').append('<option value="' + $data[i].id + '">' + $data[i].name + '</option>');
        }
      }
    }
  }, 'json');

  getScope($val, $val, $valArr);

  //选择业务角色，显示相对应的业务范围
  $('#businessRole').on('change', function(){
    $('#scope-box').html('');
    $id = $(this).val();
    getScope($id, $val, $valArr);
  });

  //获取业务范围
  function getScope($id, $valId, $idArr){
    $valId = typeof $valId != 'undefined' ? $valId : '';
    $idArr = typeof $idArr != 'undefined' ? $idArr : '';
    var $bArr1 = [];
        $bStr1 = '';
    if($id.length > 0){
      if($id == $valId && $idArr.length > 0){
        $('#businessScope').val($idArr.join(','));
        $bArr1 = $('#businessScope').val().split(',');
      }else{
        $('#businessScope').val('');
      }
      $.get('/common/bussinessRole/scopes.shtml', {roleId: $id}, function(d){
        var $code = d.code,
            $msg = d.msg,
            $data = d.objects;

        if($data.length > 0){

          //加载数据
          for(var i = 0; i < $data.length; i++){
            if($data[i].hasDefault > 0){
              $('#scope-box').append('<label><input type="checkbox" value="' + $data[i].scopeId + '" checked="checked"> ' + $data[i].scopeName + '</label>');
              $bArr1.push($data[i].scopeId);
            }else{
              $('#scope-box').append('<label><input type="checkbox" value="' + $data[i].scopeId + '"> ' + $data[i].scopeName + '</label>');
            }
          }

          //是否有选中值
          $('#scope-box label').each(function(j){
            if($id == $valId && $idArr.length > 0){
              var $b = $(this).find('input');
              if($b.is(':checked')){
                $bArr1.splice($.inArray($.trim($b.val()), $bArr1), 1);
              }
              $b.prop('checked', false);
              for(var j = 0; j < $idArr.length; j++){
                if(parseInt($idArr[j]) == parseInt($b.val())){
                  $b.prop('checked', true);
                }
              }
            }
          });
          $bStr1 = $bArr1.join(',');
          $('#businessScope').val($bStr1);

          //选中事件，写数据到businessScope内
          $('#scope-box label input').on('click', function(){
            var $bArr = [],
                $bScopeVal = $.trim($('#businessScope').val()),
                $bStr = '',
                $bVal = $.trim($(this).val());

            if($bScopeVal.length > 0){
              $bArr = $bScopeVal.split(',');
              if($(this).is(':checked')){
                $bArr.push($bVal);
              }else{
                $bArr.splice($.inArray($bVal, $bArr), 1);
              }
            }else{
              $bArr.push($bVal);
            }
            $bStr = $bArr.join(',');
            $('#businessScope').val($bStr);
          });
        }else{
          $('#scope-box').html('<span style="color:#999">无业务范围</span>');
        }
      }, 'json');
    }else{
      $('#scope-box').html('<span style="color:#999">请先选择业务范围</span>');
    }
  }
}
