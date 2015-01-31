// Foundation JavaScript
// Documentation can be found at: http://foundation.zurb.com/docs
$(document).foundation();

function filelist_expand_dir(entryElem, container) {
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
					       if (e.target.dataset.type == "dir") {
						   filelist_expand_dir(e.target, $(e.target.nextSibling));
					       } else {
						   // filelist_open_file(e.target.dataset.path);
						   wm.create(e.target.dataset.path);
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
WindowManager.prototype.create = function(path) {
    var new_win = new PreviewWindow(path);
    this.add(new_win);
};

var wm = new WindowManager();

function PreviewWindow(path) {
    var pw = this;

    this.path = path;
    this.width = 400;
    this.height = 400;

    // create dom elements
    this.div_window = $('<div>', {class: 'js-pw-window'});
    this.div_title = $('<div>', {class: 'js-pw-title'});
    this.h3_title = $('<h3>', {class: 'js-pw-title', text: this.path});
    this.a_close = $('<a>', {class: 'js-pw-close',
			     click: function(e) {
				 pw.close();
			     }}).append($('<img src="/assets/img/cross.png" />'));
    this.div_content = $('<div>', {class: 'js-pw-content'});
    this.img_content = $('<img>', {class: 'js-pw-content', src: "/preview" + this.path});

    this.div_window.css('top', '100px');
    this.div_window.css('left', '100px');
    this.div_window.css('width', this.width + 'px');
    this.div_window.css('height', this.height + 'px');

    // putting things together
    this.div_title.append(this.h3_title).append(this.a_close).appendTo(this.div_window);
    this.div_content.append(this.img_content).appendTo(this.div_window);
    this.div_window.appendTo($('body'));

    this.manager = null;

    return this;
}
PreviewWindow.prototype.close = function() {
    this.div_window.remove();
    if (this.manager != null) {
	this.manager.del(this);
    }
};

(function(){
    var filelist = $("#js-filelist");

    filelist_expand_dir(filelist[0], filelist);
})();
