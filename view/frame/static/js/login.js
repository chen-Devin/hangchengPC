/*
* 登录控件
* terry zhong
* 2017-8-2
* v1.0
*/
$(function(){
  login();
});

var login = function(){
  var $login = {
    userName : $('#username'),
    passWord : $('#password'),
    remember : $('#remember'),
    vcode : $('#vcode'),
    vcodeBox : $('#vcode-box'),
    errorMsg : $('.error-msg'),
    input : $('.form-input'),
    vcodeImg : $('#vcodeImg')
  }
  
  $login.input.on('focus', function(){
    $(this).addClass('active');
  });
  $login.input.on('blur', function(){
    $(this).removeClass('active');
  });
  // $login.input.on('keyup', function(){
  //   $login.errorMsg.text('');
  // });
  $login.vcode.on('click', function(){
    $(this).select();
  });

  if($.cookie('remember') > 0){
    $login.userName.val($.cookie('userName'));
    $login.remember.attr('checked', 'checked');
  }

  /**
   * 刷新图片验证码
   * @param target  设置图片验证码的dom元素或者jq选择器
   */
  var refreshValidateCode = function(target){
    $(target).attr('src', '/valicode.shtml?' + Math.random());
  }

  $('#vcodeImg, #checkVcode').click(function(){
    refreshValidateCode('#vcodeImg');
  });

  $("#form-login").keydown(function(e){
    var e = e || event,
    keycode = e.which || e.keyCode;
    if (keycode==13) {
      return checkForm();
    }
  });

  $('.form-submit').on('click', function(){
    return checkForm();
  });

  //表单提交
  function checkForm(){
    var $userNameVal = $.trim($login.userName.val()),
        $passWordVal = $login.passWord.val(),
        $vcodeVal = $.trim($login.vcode.val()),
        $rememberVal = $.trim($login.remember.val());

    if($userNameVal.length == 0){
      errorResult($login.errorMsg, $jsLang.login.errorMsg1, $login.userName);
      return false;
    }
    if($passWordVal.length == 0){
      errorResult($login.errorMsg, $jsLang.login.errorMsg2, $login.passWord);
      return false;
    }
    if(!$login.vcodeBox.is(':hidden')){
      //是否输入验证码
      if($login.vcode.val().length == 0){
        errorResult($login.errorMsg, $jsLang.login.errorMsg3, $login.vcode);
        return false;
      }
    }

    $.post('/login.shtml', {accid: $userNameVal, accpwd: $passWordVal, vcode: $vcodeVal}, function(d){
      //$code数据状态：
      //SUCCESS成功
      //ERROR异常报错
      //ERROR_USER_LOCKED用户锁定
      //ERROR_USER_NOT_EXIST用户不存在
      //ERROR_USER_AUTH用户帐号或密码错误
      //ERROR_IMG_VALIDATE_CODE图片验证码不正确
      //ERROR_USER_EXIST帐号已被使用
      var $code = d.code,
          $msg = d.msg,
          $objects = d.objects;

          console.log(d);

      if($code !== 'SUCCESS'){
        $login.vcodeImg.attr('src', '/valicode.shtml?' + Math.random());
      }

      if($code === 'SUCCESS'){
        var $regBodyStatus = $objects.regBodyStatus,    //注册审核状态：CLOSED关闭,AUDITING待审核,AUDITED已审核,NOT_PASS未通过
            $type = $objects.type,                      //用户类型：0员工,1司机,2管理员,3平台管理员
            $regBodyId = $objects.regBodyId,            //企业主体ID
            $reset = $objects.reset,                    //是否重置密码：true重置,false无重置
            $goUrl = '';
           
        
        if($login.remember.is(':checked')){
          $.cookie('userName', $userNameVal, {expires: 30});
          $.cookie('remember', 1, {expires: 30});
        }else{
          $.cookie('userName', '');
          $.cookie('remember', 0);
        }

        //审核状态，跳转到注册信息页面
        if($regBodyStatus === 'NOT_PASS'){
          if($regBodyId == null) $regBodyId = '';
          var $parameter = 'rbId=' + $regBodyId;
          if($type == 2 && $objects.company.bodyType == 1){
            $goUrl = '/view/regist/register2-1.html?' + $parameter;
          }else if($type == 2 && $objects.company.bodyType == 0){
            $goUrl = '/view/regist/register2-2.html?' + $parameter;
          }else{
            errorResult($login.errorMsg, $jsLang.login.errorMsg4);
            return false;
          }
        }else if($regBodyStatus === 'NOT_INIT'){
          if($type == 2){
            $.cookie('mobile', $objects.mobile, {expires: 30, path: '/view/regist/'});
            $goUrl = '/view/regist/register2-1.html';
          }
        }else if($regBodyStatus === 'AUDITING'){
          alert('您的信息正在审核中，请耐心等候！');
          return false;
        }else if($regBodyStatus === 'AUDITED'){
          //重置密码
          if($reset){
            alert('您的密码已重置，请去修改密码！');
            $goUrl = '/view/tms/user/editPassword.html';
          }else{
            $goUrl = '/view/index.html';
          }
        }else{
          alert('登录异常，请联系管理员！');
          return false;
        }
        // 页面跳转之前，先获取校验规则
        HC.ajax.get('/validationJson.shtml', {
          // TODO: 没有获取到校验规则时的错误回调
          success: function (responseData, textStatus, jqXHR) {
            // 保存校验规则到本地
            HC.layuiData(HC.constVariable.HC_TABLE_NAME, {
              key: HC.constVariable.VALIDATION_KEY_NAME,
              value: responseData
            });
          },
          complete: function () {
            window.location.href = $goUrl;
          }
        });

      }else if($code === 'ERROR_USER_LOCKED'){
        alert('您的账号被锁定，请联系管理员！');
        return false;
      }else if($code === 'ERROR_USER_NOT_EXIST'){
        alert('账号不存在，请去注册！');
        return false;
      }else if($code === 'ERROR_USER_AUTH'){
        errorResult($login.errorMsg, $msg);
        if($objects != null && $objects.indexOf('valicode') > -1){
          $login.vcodeBox.show();
        }
        return false;      
      }else if($code === 'ERROR_USER_EXIST'){
        alert('您的账号正在使用中！');
        return false;
      }else if($code === 'ERROR_IMG_VALIDATE_CODE'){
        $login.vcodeBox.show();
        errorResult($login.errorMsg, $msg, $login.vcode);
        return false;
      }else{
        alert('登录异常，请联系管理员！');
        return false;
      }
    }, 'json');
  }
}

//错误
function errorResult($errObj, $txt, $obj){
  if(typeof $obj != 'undefined'){
    $obj.focus();
    $obj.addClass('active');
  }
  $errObj.text($txt);
}