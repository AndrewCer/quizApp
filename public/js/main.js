//animation values
var bounceIn = "animated bounceIn";
var bounceInfinite = "animated infinite bounce";
var bounceOut = "animated bounceOut";
var fadeIn = "animated fadeIn";
var fadeOutDown = "animated fadeOutDown";
var rollOut = "animated rollOut";
var zoomInDown = "animated zoomInDown";
var zoomOut = "animated zoomOut";
//game variables
var questions = null;
var answeredQuestions = [];
var currentUser;
var User = function () {
  // this.id = "00000000-0000-0000-0000-000000000000" //implement later if backend is integrated
  // this.name = "";
  this.name = null;
  this.avatar = null;
  this.highScore = null;
  this.lowScore = null;
  this.inProgress = false;
  this.speed = null;
  this.currentScore = 0;
  this.questions = [];
  this.answeredQuestions = [];
}


//#region Helper Functions
function readTextFile(file, callback) {

    var rawFile = new XMLHttpRequest();
    rawFile.overrideMimeType("application/json");
    rawFile.open("GET", file, true);
    rawFile.onreadystatechange = function() {
        if (rawFile.readyState === 4 && rawFile.status == "200") {
            callback(rawFile.responseText);
        }
    }
    rawFile.send(null);
}

Array.prototype.shuffleArray = function() {

  var array = this;

  var i = 0
    , j = 0
    , temp = null

  for (i = array.length - 1; i > 0; i -= 1) {
    j = Math.floor(Math.random() * (i + 1))
    temp = array[i]
    array[i] = array[j]
    array[j] = temp
  }
}

function animateIn() {
  $(".animate-in-out").addClass(bounceIn);
}

function updateStorage() {
  localStorage.setItem("appUser", JSON.stringify(currentUser));
}

function clearUserState() {
  currentUser.currentScore = 0;
  currentUser.questions = [];
  currentUser.answeredQuestions = [];
  currentUser.inProgress = false;
}
//#endregion


//#region New User
function newUserState() {

  $.get("/templates/welcome.html", function (data) {
      $("#main-content").empty().append(data);
      animateIn();
      $(".bouncer").hover(function (e) {
        $(e.target).addClass(bounceInfinite);
      }, function (e) {
        $(e.target).removeClass(bounceInfinite);
      });
      $(".bouncer").on("click", function (e) {
        currentUser = new User();
        var target = $(e.target);
        var imgSource = target.prop('src').split("/");
        currentUser.avatar = imgSource[imgSource.length - 2] + "/" + imgSource[imgSource.length - 1];
        var closestChild = target.closest("div").siblings().find("img");
        target.removeClass(bounceInfinite);
        $(".animate-in-out").addClass(bounceOut).one("animationend", function () {
          setCardState();
        });
        closestChild.one("animationend", function () {
          closestChild.removeClass(fadeOutDown).addClass("hidden");
        })
      })
  })


}
//#endregion

//#region Previous User State
function prevUserState() {
  currentUser = JSON.parse(localStorage.getItem("appUser"));
  $.get("/templates/home.html", function (template) {
    $("#main-content").empty().append(template);
    var avatar = $(".avatar");
    avatar.attr("src", currentUser.avatar);
    $("#new-game").on("click", function () {
      clearUserState();
      setCardState();
    });
    if (currentUser.name) $("#user-name").removeClass("hidden");
    if (currentUser.questions.length) {
      $("#resume-game").removeClass("hidden");
      $("#resume-game").on("click", function () {
        setCardState();
      })
    }
    if (!currentUser.inProgress) {
      var recap = $("#recap");
      recap.removeClass("hidden");
      setTimeout(function () {
        avatar.addClass("animated swing")
      }, 5000);
      avatar.on("click", function () {
        setGameOver();
      });
      recap.on("click", function () {
        setGameOver();
      });
    }
    animateIn();

  })
}
//#endregion

//#region Main game
function buildCardView(data, newGame) {

  $.get("/templates/game.html", function(template) {
    var selected = null;
    $("#main-content").empty().append(template);
    $("#question").html(data.question);
    data.answers.forEach(function (q) {
      $("#questions").append('<div class="card text-center col-md-6 col-md-offset-3" role="button"><img class="img-responsive answer-card" src="assets/answer-unselected.png" alt="answer not selected background"><div class="caption"><p>' + q.answer + '</p></div></div>');
    })
    $(".card").hover(function (e) {
      var cardImg = $(this).closest(".card").children(".answer-card");
      cardImg.attr("src", "/assets/answer-selected.png");
    }, function (e) {
      var cardImg = $(this).closest(".card").children(".answer-card");
      if (!selected) cardImg.attr("src", "/assets/answer-unselected.png");
    });
    $(".card").on("click", function (e) {
      var cardImg = $(this).closest(".card").children(".answer-card");
      $(this).unbind('mouseenter mouseleave');
      currentUser.inProgress = true;
      $(".card").css("pointer-events", "none");
      selected = $(".card").index(this);
      data.answered = data.answers[selected];
      data.answered.selectedIndex = selected;
      // NOTE: calculating correct answer up front to reduce heavier calculation at setGameOver();
      data.answers.forEach(function (a, i) {
        if (a.score === 1) data.answered.correctIndex = i;
      })
      currentUser.answeredQuestions.push(data);
      currentUser.questions.splice(0, 1);
      var overlay = $(".overlay");
      if ($(window).width() < 1500) overlay.children().attr("class", "img-responsive");
      if (data.answered.score) {
        currentUser.currentScore += data.answered.score;
        overlay.children().attr("src", "/assets/correct-tilt.png");
        overlay.css("display", "block").addClass(zoomInDown).one("animationend", function () {
          $(".animate-in-out").addClass(rollOut).one("animationend", function () {
            setTimeout(function () {
              $('#main-content').empty();
              setCardState();
            }, 1000);
          });
        });

      }
      else {
        cardImg.attr("src", "/assets/answer-incorrect.png");
        overlay.children().attr("src", "/assets/incorrect-tilt.png")
        overlay.css("display", "block").addClass(zoomInDown).one("animationend", function () {
          $(".animate-in-out").addClass(zoomOut).one("animationend", function () {
            setTimeout(function () {
              $('#main-content').empty();
              setCardState();
            }, 1000);
          });
        });
      }

      updateStorage();

    });
  })
}

function setCardState() {
  if (currentUser.questions.length === 0 && currentUser.inProgress === false) {
    readTextFile("/json/data.json", function (text) {
      currentUser.questions = JSON.parse(text)[0].questions;
      currentUser.questions.shuffleArray();
      buildCardView(currentUser.questions[0], true);
    })
  }
  else if (currentUser.questions.length > 0){
    buildCardView(currentUser.questions[0]);
  } else {
    setGameOver()
  }


}

function buildBTT() {
  var toTop = $("#to-top");
  var scrollTrigger = 100;
  $(window).on('scroll', function () {
    var scrollTop = $(window).scrollTop();
    if (scrollTop > scrollTrigger) {
      toTop.removeClass("hidden");
      toTop.addClass();
    }
    else {
      toTop.addClass("hidden");
    }
  });
  toTop.on("click", function (e) {
    e.preventDefault();
    $("html,body").animate({
      scrollTop: 0
    }, 700);
  });
}

function setGameOver() {

  $.get("/templates/game-over.html", function(template) {
    $("#main-content").empty().append(template);
    buildBTT();
    currentUser = JSON.parse(localStorage.getItem("appUser"));
    currentUser.inProgress = false;
    if (!currentUser.highScore || currentUser.highScore < currentUser.currentScore) currentUser.highScore = currentUser.currentScore;
    updateStorage();
    $("#new-game").on("click", function () {
      clearUserState();
      setCardState();
    });
    $(".score").append('<p> Current: ' + currentUser.currentScore + "/" + currentUser.answeredQuestions.length + '</p>');
    $(".score").append('<p> Best: ' + currentUser.highScore + "/" + currentUser.answeredQuestions.length + '</p>');
    $(".avatar").attr("src", currentUser.avatar);
    if (!currentUser.name) $(".no-name").removeClass("hidden");
    currentUser.answeredQuestions.forEach(function (card, i) {
      $("#recap").append('<div class="row"><div id="card-'+ i +'" class="col-md-8 col-md-offset-2 separator"></div></div>')
      $("#card-" + i).append('<h1 class="col-xs-6 col-xs-offset-3">' + card.question + '</h1>')
      card.answers.forEach(function (q, qIndex) {
        var answerImg = '<img class="img-responsive" src="assets/answer-unselected.png" alt="answer not selected image">';
        if (q.score === 1) {
          answerImg = '<img class="img-responsive" src="assets/answer-selected.png" alt="answer selected background">';
        }
        else if (q.score === 0 && card.answered.selectedIndex === qIndex) {
          answerImg = '<img class="img-responsive" src="assets/answer-incorrect.png" alt="answer selected background">';
        }
        $("#card-" + i).append('<div class="card text-center col-xs-6 col-xs-offset-3">' + answerImg +'<div class="caption"><p>' + q.answer + '</p></div></div>');
      })
    })
  });
}
//#endregion

$(function() {

    if (!localStorage.getItem('appUser')) newUserState();
    else prevUserState();

});
