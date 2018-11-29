$("#regis").focus(function () {
    $("#user-notice").css("display", "inline-block")
})


$("#regis").blur(function () {
    $("#user-notice").hide();
})
$("#regispwd").focus(function () {
    $("#pwd-notice").css("display", "inline-block")
})


$("#regispwd").blur(function () {
    $("#pwd-notice").hide();
})
