var getVideos = function(){
  $.getJSON("/videofilenames",function(data){
	console.log(data);
       for(var folder in data){
        if(data[folder].indexOf("wedding") == -1){
          continue;
        }
        $("body").append('<video width="320" height="240" controls><source src="'+data[folder]+"/"+data[folder]+'.3gp" type="video/mp4">Your browser does not support the HTML5 video tag.</video>');
 
       }
  });
};

$('document').ready(function () {
 getVideos();
});
