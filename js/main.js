// TODO: create an array of outro animations for the cards
//animation values
var bounceInfinite = "animated infinite bounce";
var fadeOutDown = "animated fadeOutDown";
var bounceOut = "animated bounceOut";
var bounceIn = "animated bounceIn";
//game variables
var questions = [];
var answeredQuestions = [];
var score = 0;
var user = function () {
  // this.id = "00000000-0000-0000-0000-000000000000" //implement later if backend is integrated
  // this.name = "";
  this.avatar = avatar;
  this.hiScore = null;
  this.lowScore = null;
  this.speed = null;
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
  // return array;
}
//#endregion

function animateIn() {
  $(".animate-in-out").addClass(bounceIn);
}

//#region New User
function newUserState() {
  $.get("/templates/welcome.html", function (data) {
      $('#main-content').empty().append(data);
      animateIn();
      $(".bouncer").hover(function (e) {
        $(e.target).addClass(bounceInfinite);
      }, function (e) {
        $(e.target).removeClass(bounceInfinite);
      });
      $(".bouncer").on("click", function (e) {
        var target = $(e.target);
        var closestChild = target.closest("div").siblings().find("img");
        target.removeClass(bounceInfinite);
        // closestChild.addClass(fadeOutDown);
        // $('.ftt').addClass('hidden');
        // $('.play-button').removeClass("hidden").on("click", function () {
          $(".animate-in-out").addClass(bounceOut).one("animationend", function () {
            setCardState();
          });
        // });
        closestChild.one("animationend", function () {
          // TODO: center avatar after one fades away
          // target.parent().attr("class", "").addClass("col-md-8");
          closestChild.removeClass(fadeOutDown).addClass("hidden");
        })
      })
  })


}
//#endregion

function setCardState() {

    $.get("/templates/game.html", function(template) {
      readTextFile("/json/data.json", function(text){
          questions = JSON.parse(text)[0].questions;
          questions.shuffleArray();
          // console.log(questions);
          var data = questions[0];
          var selected = null;
          $("#main-content").empty().append(template);
          $("#question").html(data.question);
          data.answers.forEach(function (q) {
            $("#questions").append('<div class="card text-center col-md-6 col-md-offset-3" role="button"><img class="img-responsive" src="assets/answer-unselected.png" alt="answer not selected background"><div class="caption"><p>' + q.answer + '</p></div></div>');
          })
          // TODO: flesh out logic for hover. As it tends to selects different elements depending on where mouse is
          // $(".card").hover(function (e) {
          //   $(e.target).attr("src", "/assets/answer-selected.png");
          // }, function (e) {
          //   if (!selected) $(e.target).attr("src", "/assets/answer-unselected.png");
          // });
          $(".card").on("click", function (e) {
            selected = $('.card').index(this);
            data.answered = data.answers[selected];
            answeredQuestions.push(data);
            questions.splice(0, 1);
            if (data.answered.score) {
              // TODO: display CORRECT text
              score += data.answered.score;
              console.log(data.answered);
            }
            else {
              // TODO: display INCORRECT text
            }
            // TODO: animate card out and bring in new card with animation

            // $(e.target).attr("src", "/assets/answer-selected.png");
          })
          animateIn();
      });
    });


}

$(function() {

    if (!localStorage.getItem('user')) {
      newUserState();
    }

});

// TODO: once the user picks an avatar, create a user in local storage for them
// localStorage.setItem('testObject', JSON.stringify(testObject));
