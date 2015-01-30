// Foundation JavaScript
// Documentation can be found at: http://foundation.zurb.com/docs
$(document).foundation();

function filelist_expand_dir(entryElem, container) {
    console.debug(entryElem, container);
    $.getJSON("/api/lsdir" + entryElem.dataset.path,
	      function(jsonData, status, jqxhr) {
		  container.empty()
		  for (var i = 0; i < jsonData.length; i++) {
		      var entry = jsonData[i];
		      var elem = $('<li>', {class: "js-filelist-" + entry.type});
		      var child_ul = $('<ul>');
		      var anch = $('<a>', {id: entry.id,
					   "data-path": entry.path,
					   "data-type": entry.type,
					   "data-name": entry.name,
					   text: entry.name,
					   class: "js-filelist-" + entry.type,
					   click: function(e){
					       console.debug(e);
					       console.debug(e.target.nextSibling);
					       if (e.target.dataset.type == "dir") {
						   filelist_expand_dir(e.target, $(e.target.nextSibling));
					       } else {
						   filelist_open_file(e.target.dataset.path);
					       }
					   }});
		      elem.append(anch);
		      elem.append(child_ul);
		      container.append(elem);
		  }
	      });
}

function filelist_open_file(path) {
    window.open('/file' + path, '_blank');
}

(function(){
    var filelist = $("#js-filelist");

    filelist_expand_dir(filelist[0], filelist);
})();
