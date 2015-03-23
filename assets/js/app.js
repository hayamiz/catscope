// Foundation JavaScript
// Documentation can be found at: http://foundation.zurb.com/docs
$(document).foundation();

var io = new RocketIO().connect();
var filelist_min_height = 0;

function __filelist_click_handler_builder(jq_child_ul) {
    return function(e){
	if (e.target.dataset.type == "dir") {
	    if (e.target.dataset.opened == "false") {
		e.target.dataset.opened = "true";
		filelist_expand_dir(e.target, $(e.target.nextSibling));
	    } else {
		e.target.dataset.opened = "false";
		jq_child_ul.empty();
	    }

	    window.setTimeout(function(){
		var filelist = $("#js-filelist");
		if (filelist.height() > filelist_min_height) {
		    filelist_min_height = filelist.height();
		}
		filelist.css("min-height", filelist_min_height);
	    }, 100);
	} else {
	    // filelist_open_file(e.target.dataset.path);
	    wm.create(e.target.dataset.path);
	}
    };
}

function filelist_expand_dir(entryElem, container) {
    $.getJSON("/api/lsdir/" + entryElem.dataset.path,
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
					   "data-opened": "false",
					   text: entry.name,
					   class: "js-filelist-" + entry.type,
					   click: __filelist_click_handler_builder(child_ul)});
		      var save_link = $('<a>', {href: "/save/" + entry.path})
		      save_link.append($('<img>', {src: "/assets/img/disk.png"}));

		      elem.append(anch);
		      if (entry.type != "dir") {
			  elem.append("&nbsp;");
			  elem.append(save_link);
		      }
		      elem.append(child_ul);
		      container.append(elem);
		  }
	      });
}

function filelist_open_file(path) {
    window.open('/file' + path, '_blank');
}


function WindowManager() {
    this.windows = [];
}
WindowManager.prototype.add = function(win) {
    this.windows.push(win);
    win.manager = this;
};
WindowManager.prototype.del = function(win) {
    for (var i = 0; i < this.windows.length; i++) {
	if (this.windows[i] == win) {
	    this.windows.splice(i--, 1);
	}
    }
};
WindowManager.prototype.set_zindex = function() {
    for (var i = 0; i < this.windows.length; i++) {
	this.windows[i].div_window.css('z-index', i);
    }
};
WindowManager.prototype.create = function(path) {
    var new_win = new PreviewWindow(path);
    this.add(new_win);
};
WindowManager.prototype.reload_by_path = function(path) {
    for (var i = 0; i < this.windows.length; i++) {
	if (this.windows[i].path == path) {
	    this.windows[i].reload();
	}
    }
}

var wm = new WindowManager();

function PreviewWindow(path) {
    var pw = this;

    this.path = path;
    this.width = 600;
    this.height = 400;

    // create dom elements
    this.div_window = $('<div>', {class: 'js-pw-window',
				  click: function(e) {
				      pw.focus();
				  }});
    this.div_title = $('<div>', {class: 'js-pw-title',
				 click: function(e) {
				     pw.focus();
				 }});
    this.h3_title = $('<h3>', {class: 'js-pw-title',
			       text: this.path});
    this.a_close = $('<a>', {class: 'js-pw-close',
			     click: function(e) {
				 pw.close();
			     }}).append($('<img src="/assets/img/cross.png" />'));
    this.div_content = $('<div>', {class: 'js-pw-content'});

    this.content_elem = this.generate_content_elem();

    this.div_window.css('left', 100 + window.scrollX + 'px');
    this.div_window.css('top', 100 + window.scrollY + 'px');
    this.div_window.css('width', this.width + 'px');
    this.div_window.css('height', this.height + 'px');

    // putting things together
    this.div_title.append(this.h3_title).append(this.a_close).appendTo(this.div_window);
    this.div_content.append(this.content_elem).appendTo(this.div_window);
    this.div_window.appendTo($('body'));

    this.resize();

    this.div_window.draggable();
    this.div_window.resizable({
	resize: function(e, ui) {
	    pw.resize();
	}
    });

    this.manager = null;

    // send event to server
    io.push("open_file", this.path);

    return this;
}
PreviewWindow.prototype.close = function() {
    this.div_window.remove();
    if (this.manager != null) {
	this.manager.del(this);
    }
    io.push("close_file", this.path);
};
PreviewWindow.prototype.focus = function() {
    var my_idx;

    console.log("focus");

    if (this.manager == null) {
	return;
    }

    this.manager.del(this);
    this.manager.add(this);
    this.manager.set_zindex();
};
PreviewWindow.prototype.resize = function() {
    this.width = this.div_window.width();
    this.height = this.div_window.height();
    this.div_content.height(this.div_window.height() - this.div_title.height());
};
PreviewWindow.prototype.reload = function() {
    console.log("reload " + this.path);
    this.content_elem.attr("src", "/preview/" + this.path + "?" + (new Date()).getTime());
};
PreviewWindow.prototype.generate_content_elem = function() {
    var timehash = (new Date()).getTime().toString();
    var src_url = "/preview/" + this.path + "?" + timehash;

    if (this.path.match(/\.(jpe?g|png|eps|svg)/i)) { // images as img
	// create off screen image first
	var img = new Image();
	img.onload = function() {
	    // TODO: window resizing
	    // alert(this.width + "x" + this.height);
	}
	img.src = src_url;

	this.content_elem = $('<img>', {class: 'js-pw-content', src: src_url});
    } else { // other files as text in iframe
	this.content_elem = $('<iframe>', {class: 'js-pw-content', src: src_url});
    }

    return this.content_elem;
};

(function(){
    var filelist = $("#js-filelist");

    filelist_expand_dir(filelist[0], filelist);

    io.on("file_modified", function(path){
	console.log("file_modified : " + path);
	wm.reload_by_path(path);
    });
    io.on("file_moved", function(path){
	console.log("file_moved : " + path);
	wm.reload_by_path(path);
    });
    io.on("file_deleted", function(path){
	console.log("file_deleted : " + path);
	wm.reload_by_path(path);
    });
})();
