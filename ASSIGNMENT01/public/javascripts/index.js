$(window).on("scroll", function(){
    if($(this).scrollTop() > 80){
        $("header").addClass("scrolledHeader");
    }else{
        $("header").removeClass("scrolledHeader");
    }
});
// Slide right
function slideRigth(){
    var reveals = document.querySelectorAll(".slide-right");
    for(var i  = 0; i < reveals.length; i++){
        var windowHeight = window.innerHeight;
        var elementTop = reveals[i].getBoundingClientRect().top;
        var elementVisible = 100;
        if(elementTop < windowHeight -elementVisible){
            reveals[i].classList.add("active");
        }else{
            reveals[i].classList.remove("active");
        }
    }
}
window.addEventListener("scroll", slideRigth);
// Slide down
function slideDown(){
    var reveals = document.querySelectorAll(".slide-down");
    for(var i  = 0; i < reveals.length; i++){
        var windowHeight = window.innerHeight;
        var elementTop = reveals[i].getBoundingClientRect().top;
        var elementVisible = 100;
        if(elementTop < windowHeight -elementVisible){
            reveals[i].classList.add("active");
        }else{
            reveals[i].classList.remove("active");
        }
    }
}
window.addEventListener("scroll", slideDown);
//Slide up
function slideUp(){
    var reveals = document.querySelectorAll(".slide-up");
    for(var i  = 0; i < reveals.length; i++){
        var windowHeight = window.innerHeight;
        var elementTop = reveals[i].getBoundingClientRect().top;
        var elementVisible = 100;
        if(elementTop < windowHeight -elementVisible){
            reveals[i].classList.add("active");
        }else{
            reveals[i].classList.remove("active");
        }
    }
}
window.addEventListener("scroll", slideUp);


function changeImage(image) {
    document.getElementById('main-image').src = image;
}

