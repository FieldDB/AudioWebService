[![Build Status](https://travis-ci.org/OpenSourceFieldlinguistics/AudioWebService.png)](https://travis-ci.org/OpenSourceFieldlinguistics/AudioWebService)
# AudioWebService

A small service which can run the [Sphinx latice demo](https://www.assembla.com/code/sonido/subversion/nodes/7/sphinx4/src/apps/edu/cmu/sphinx/demo/lattice/LatticeDemo.java), the [ProsodyLab](https://github.com/kylebgorman/Prosodylab-Aligner) aligner and various [Praat Scripts](https://github.com/OpenSourceFieldlinguistics/Praat-Scripts) to detect utterances and syllables in any file which contains an audio track. 

## How to use
### On the server
Install the module with: `npm install fielddb-audio-service` or by cloning this repository `git clone https://github.com/OpenSourceFieldlinguistics/AudioWebService.git`

```bash
node service.js &
```

### Upload using curl or shell script 

```bash
curl -F files=@$HOME/Documents/georgian/phrases/alo.mp3 
	-F files=@$HOME/Documents/georgian/phrases/ara.mp3 
	-F token=mytokengoeshere 
	-F username=testingupload 
	-F dbname=testingupload-firstcorpus 
	https://localhost:3184/upload/extract/utterances 

```

### Upload using an HTML5 browser client

```html
<form class="form-inline button-group" id="uploadAudioForTextGridform" enctype="multipart/form-data" action="{{audioServerUrl}}/upload/extract/utterances" method="post">
	<label>
		<span>Import long audio/video elicitation session(s) </span>
	</label>
	<div class="input-prepend">
		<span class="btn btn-default btn-file btn-info btn-mini">
			<span>
				<i class="icon-file"></i> 
				Choose file(s)
			</span>
			<input id="uploadAudioForTextGridformFiles" type="file" multiple="true" name="files" value="Audio/Video files to be imported"/>
		</span>
	</div>
	<div class="input-append">
		<button class="btn btn-info btn-mini" type="submit">
			<i class="icon-upload"></i>
			<span> Upload</span>
		</button>
	</div>
	<input class="hidden" type="text" name="token" value="{{audiouploadtoken}}"/>
	<input class="hidden" type="text" name="username" value="{{username}}"/>
	<input class="hidden" type="text" name="dbname" value="{{pouchname}}"/>
	<input class="hidden" type="text" name="returnTextGrid" value="true"/>
</form>
```

### Upload using Javascript/jQuery/Backbone/AJAX browser client

In your code, you can also use jQuery or Backbone to perform the upload and do something with the resulting json.

```js
(Backbone event)
"submit #uploadAudioForTextGridform": function(e) {
  if (e) {
    e.stopPropagation();
    e.preventDefault();
  }

  //get the action-url of the form
  var actionurl = e.currentTarget.action;
  var data = new FormData();
  jQuery.each($('#uploadAudioForTextGridformFiles')[0].files, function(i, file) {
    data.append(i, file);
  });
  data.append("token", "testinguploadtoken");
  data.append("pouchname", this.model.get("pouchname"));
  data.append("username", window.app.get("authentication").get("userPrivate").get("username"));
  data.append("returnTextGrid", true);
  this.model.get("audioVideo").reset();
  var self = this;
  $.ajax({
    url: actionurl,
    type: 'post',
    // dataType: 'json',
    cache: false,
    contentType: false,
    processData: false,
    data: data,
    success: function(results) {
      if (results && results.status === 200) {
        self.model.set("uploadDetails", results);
        self.model.set("files", results.files);
        self.model.set("status", "File(s) uploaded and utterances were extracted.");
        var messages = [];
        self.model.set("rawText","");
        /* Check for any textgrids which failed */
        for (var fileIndex = 0; fileIndex < results.files.length; fileIndex++) {
          if (results.files[fileIndex].textGridStatus >= 400) {
            console.log(results.files[fileIndex]);
            var instructions = instructions = results.files[fileIndex].textGridInfo;
            if(results.files[fileIndex].textGridStatus >= 500){
              instructions = " Please report this error to us at support@lingsync.org ";
            }
            messages.push("Generating the textgrid for " + results.files[fileIndex].fileBaseName + " seems to have failed. "+instructions);
          } else {
            self.model.addAudioVideoFile(audioUrl + "/" + self.model.get("pouchname") + "/" + results.files[fileIndex].fileBaseName + '.mp3');
            self.model.downloadTextGrid(results.files[fileIndex]);
          }
        }
        if (messages.length > 0) {
          self.model.set("status", messages.join(", "));
          $(self.el).find(".status").html(self.model.get("status"));
          window.appView.toastUser(messages.join(", "), "alert-danger", "Import:");
        }
      } else {
        console.log(results);
        var message = "Upload might have failed to complete processing on your file(s). Please report this error to us at support@lingsync.org ";
        self.model.set("status", message + ": " + JSON.stringify(results));
        window.appView.toastUser(message, "alert-danger", "Import:");
      }
      $(self.el).find(".status").html(self.model.get("status"));
    },
    error: function(response) {
      var reason = {};
      if (response && response.responseJSON) {
        reason = response.responseJSON;
      } else {
        var message = "Error contacting the server. ";
        if (response.status >= 500) {
          message = message + " Please report this error to us";
        } else if (response.status === 413) {
          message = message + " Your file is too big for upload, please try using FFMpeg to convert it to an mp3 for upload (you can still use your original video/audio in the app when the utterance chunking is done on an mp3.) ";
        } else {
          message = message + " Are you offline? If you are online and you still recieve this error, please report it to us: ";
        }
        reason = {
          status: response.status,
          userFriendlyErrors: [message + response.status]
        };
      }
      console.log(reason);
      if (reason && reason.userFriendlyErrors) {
        self.model.set("status", "Upload error: " + reason.userFriendlyErrors.join(" "));
        window.appView.toastUser(reason.userFriendlyErrors.join(" "), "alert-danger", "Import:");
        $(self.el).find(".status").html(self.model.get("status"));
      }
    }
  });
  this.model.set("status", "Contacting server...");
  $(this.el).find(".status").html(this.model.get("status"));
},
```

### Upload using an Android client 

```java
HttpURLConnection urlConnection;
try {
	url = new URL(urlStringAuthenticationSession);
	urlConnection = (HttpURLConnection) url.openConnection();
	urlConnection.setRequestMethod("POST");
	urlConnection
	.setRequestProperty("Content-Type", "application/json");
	urlConnection.setDoInput(true);
	urlConnection.setDoOutput(true);
	urlConnection.connect();
} catch (MalformedURLException e) {
	e.printStackTrace();
	this.userFriendlyErrorMessage = "Problem determining which server to contact, please report this error.";
	return null;
} catch (ProtocolException e) {
	this.userFriendlyErrorMessage = "Problem using POST, please report this error.";
	e.printStackTrace();
	return null;
} catch (IOException e) {
	this.userFriendlyErrorMessage = "Problem opening connection to server, please report this error.";
	e.printStackTrace();
	return null;
}
JsonObject jsonParam = new JsonObject();
jsonParam.addProperty("token", token);
jsonParam.addProperty("username", username);
jsonParam.addProperty("dbname", dbname);
jsonParam.addProperty("returnTextGrid", returnTextGrid);

DataOutputStream printout;
try {
	printout = new DataOutputStream(urlConnection.getOutputStream());
	String jsonString = jsonParam.toString();
	Log.d(Config.TAG, jsonString);
	printout.write(jsonString.getBytes());
	printout.flush();
	printout.close();
} catch (IOException e) {
	e.printStackTrace();
	this.userFriendlyErrorMessage = "Problem writing to the server connection.";
	return null;
}
String JSONResponse = this.processResponse(url, urlConnection);

```


## Formal Documentation
http://opensourcefieldlinguistics.github.io/FieldDB/

## Examples
See the test for current examples.


## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Jasmine Node](http://jasmine.github.io/).


## Release History
* v0.1 Sept 16 2011 Audio upload and sphinx execution for Android client 
* v1.56 May 26 2013 Run ProsodyLab Aligner 
* v1.70 Aug 26 2013 Detect syllables using Praat 
* v1.102.3 April 22 2014 Long audio import support 
* v2.2.0 May 19 2014 Support for 1.5GB movies 


## License
Copyright (c) 2014 OpenSourceFieldLinguistics Contribs  
Licensed under the Apache 2.0 license.
