(function () {
    "use strict";

    // Text file extensions that support clipboard copy
    var TEXT_EXTENSIONS = [
        ".txt", ".tsv", ".csv", ".log", ".md", ".yaml", ".yml",
        ".toml", ".json", ".xml", ".html", ".css", ".js"
    ];

    // Image extensions displayed with <img>
    var IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".eps"];

    function getExtension(path) {
        var dot = path.lastIndexOf(".");
        if (dot === -1) return "";
        return path.substring(dot).toLowerCase();
    }

    function isTextFile(path) {
        return TEXT_EXTENSIONS.indexOf(getExtension(path)) !== -1;
    }

    function isImageFile(path) {
        return IMAGE_EXTENSIONS.indexOf(getExtension(path)) !== -1;
    }

    function isPDF(path) {
        return getExtension(path) === ".pdf";
    }

    function isEPS(path) {
        return getExtension(path) === ".eps";
    }

    function isCSV(path) {
        var ext = getExtension(path);
        return ext === ".csv" || ext === ".tsv";
    }

    // ---- Toast ----
    function showToast(message) {
        var el = document.createElement("div");
        el.className = "toast";
        el.textContent = message;
        document.body.appendChild(el);
        setTimeout(function () {
            el.classList.add("fade-out");
            setTimeout(function () { el.remove(); }, 500);
        }, 2500);
    }

    // ---- WindowManager ----
    var WindowManager = {
        windows: [],
        nextOffset: 0,

        add: function (win) {
            this.windows.push(win);
            this.updateZIndices();
        },

        remove: function (win) {
            var idx = this.windows.indexOf(win);
            if (idx !== -1) this.windows.splice(idx, 1);
            this.updateZIndices();
        },

        create: function (path) {
            var win = new PreviewWindow(path);
            this.add(win);
            return win;
        },

        bringToFront: function (win) {
            var idx = this.windows.indexOf(win);
            if (idx !== -1) {
                this.windows.splice(idx, 1);
                this.windows.push(win);
                this.updateZIndices();
            }
        },

        updateZIndices: function () {
            for (var i = 0; i < this.windows.length; i++) {
                this.windows[i].el.style.zIndex = 100 + i;
            }
        },

        reloadByPath: function (path) {
            for (var i = 0; i < this.windows.length; i++) {
                if (this.windows[i].path === path) {
                    this.windows[i].reload();
                }
            }
        },

        showDeletedByPath: function (path) {
            for (var i = 0; i < this.windows.length; i++) {
                if (this.windows[i].path === path) {
                    this.windows[i].showDeleted();
                }
            }
        },

        getWatchedPaths: function () {
            var paths = [];
            for (var i = 0; i < this.windows.length; i++) {
                if (paths.indexOf(this.windows[i].path) === -1) {
                    paths.push(this.windows[i].path);
                }
            }
            return paths;
        },

        getCascadeOffset: function () {
            var offset = (this.nextOffset % 10) * 30;
            this.nextOffset++;
            return offset;
        }
    };

    // ---- PreviewWindow ----
    function PreviewWindow(path) {
        this.path = path;
        this.textContent = null;
        this.isText = false;
        this.el = null;
        this.contentEl = null;
        this.copyBtnContainer = null;
        this.init();
    }

    PreviewWindow.prototype.init = function () {
        var self = this;
        var main = document.getElementById("main");
        var offset = WindowManager.getCascadeOffset();

        this.el = document.createElement("div");
        this.el.className = "preview-window";
        this.el.style.left = (20 + offset) + "px";
        this.el.style.top = (20 + offset) + "px";

        // Title bar
        var titleBar = document.createElement("div");
        titleBar.className = "preview-titlebar";

        var title = document.createElement("span");
        title.className = "preview-title";
        title.textContent = this.path;
        titleBar.appendChild(title);

        // Placeholder for copy button (added dynamically based on Content-Type)
        this.copyBtnContainer = document.createElement("span");
        titleBar.appendChild(this.copyBtnContainer);
        this.detectTextAndEnableCopy();

        // Close button
        var closeBtn = document.createElement("button");
        closeBtn.className = "btn";
        closeBtn.title = "Close";
        closeBtn.innerHTML = '<img src="/assets/icons/close.svg" alt="Close">';
        closeBtn.addEventListener("click", function (e) {
            e.stopPropagation();
            self.close();
        });
        titleBar.appendChild(closeBtn);

        this.el.appendChild(titleBar);

        // Content area
        this.contentEl = document.createElement("div");
        this.contentEl.className = "preview-content";
        this.el.appendChild(this.contentEl);

        // Resize handle
        var resizeHandle = document.createElement("div");
        resizeHandle.className = "preview-resize";
        this.el.appendChild(resizeHandle);

        // Load content
        this.loadContent();

        // Event: bring to front on click
        this.el.addEventListener("pointerdown", function () {
            WindowManager.bringToFront(self);
        });

        // Drag move
        this.setupDrag(titleBar);

        // Resize
        this.setupResize(resizeHandle);

        main.appendChild(this.el);

        // Send watch
        WS.send({ type: "watch", path: this.path });
    };

    PreviewWindow.prototype.loadContent = function () {
        var self = this;
        var ts = Date.now();
        this.contentEl.innerHTML = "";

        if (isEPS(this.path)) {
            var img = document.createElement("img");
            img.src = "/preview/" + this.path + "?t=" + ts;
            img.onerror = function () {
                fetch("/preview/" + self.path)
                    .then(function (r) {
                        if (r.status === 501) {
                            self.contentEl.innerHTML =
                                '<div class="preview-error">' +
                                "Cannot preview because ImageMagick is not installed.<br>" +
                                '<a href="/save/' + self.path + '">Download file</a>' +
                                "</div>";
                        }
                    });
            };
            this.contentEl.appendChild(img);
        } else if (isImageFile(this.path)) {
            var img = document.createElement("img");
            img.src = "/preview/" + this.path + "?t=" + ts;
            this.contentEl.appendChild(img);
        } else if (isPDF(this.path)) {
            var iframe = document.createElement("iframe");
            iframe.src = "/preview/" + this.path + "?t=" + ts;
            this.contentEl.appendChild(iframe);
        } else if (isCSV(this.path)) {
            this.loadCSVContent();
        } else {
            var iframe = document.createElement("iframe");
            iframe.src = "/preview/" + this.path + "?t=" + ts;
            this.contentEl.appendChild(iframe);
        }
    };

    PreviewWindow.prototype.loadCSVContent = function () {
        var self = this;
        var delimiter = getExtension(this.path) === ".tsv" ? "\t" : ",";

        fetch("/file/" + this.path)
            .then(function (r) { return r.text(); })
            .then(function (text) {
                self.contentEl.innerHTML = "";
                var lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
                // Remove trailing empty line
                while (lines.length > 0 && lines[lines.length - 1] === "") {
                    lines.pop();
                }
                if (lines.length === 0) return;

                var rows = [];
                for (var i = 0; i < lines.length; i++) {
                    rows.push(lines[i].split(delimiter));
                }

                var wrapper = document.createElement("div");
                wrapper.className = "csv-table-wrapper";

                var table = document.createElement("table");
                table.className = "csv-table";

                // Header
                var thead = document.createElement("thead");
                var headerRow = document.createElement("tr");
                for (var c = 0; c < rows[0].length; c++) {
                    var th = document.createElement("th");
                    th.textContent = rows[0][c];
                    var arrow = document.createElement("span");
                    arrow.className = "sort-arrow";
                    th.appendChild(arrow);
                    th.addEventListener("click", (function (colIdx) {
                        return function () { sortCSVTable(table, colIdx); };
                    })(c));
                    headerRow.appendChild(th);
                }
                thead.appendChild(headerRow);
                table.appendChild(thead);

                // Body
                var tbody = document.createElement("tbody");
                for (var r = 1; r < rows.length; r++) {
                    var tr = document.createElement("tr");
                    for (var c = 0; c < rows[r].length; c++) {
                        var td = document.createElement("td");
                        td.textContent = rows[r][c];
                        tr.appendChild(td);
                    }
                    tbody.appendChild(tr);
                }
                table.appendChild(tbody);

                wrapper.appendChild(table);
                self.contentEl.appendChild(wrapper);
            });
    };

    function sortCSVTable(table, colIndex) {
        var thead = table.querySelector("thead");
        var tbody = table.querySelector("tbody");
        var ths = thead.querySelectorAll("th");
        var currentTh = ths[colIndex];

        // Determine sort direction
        var ascending = currentTh.getAttribute("data-sort") !== "asc";

        // Clear all sort indicators
        for (var i = 0; i < ths.length; i++) {
            ths[i].removeAttribute("data-sort");
            ths[i].querySelector(".sort-arrow").textContent = "";
        }

        currentTh.setAttribute("data-sort", ascending ? "asc" : "desc");
        currentTh.querySelector(".sort-arrow").textContent = ascending ? " \u25B2" : " \u25BC";

        var rows = Array.prototype.slice.call(tbody.querySelectorAll("tr"));
        rows.sort(function (a, b) {
            var aText = (a.cells[colIndex] || {}).textContent || "";
            var bText = (b.cells[colIndex] || {}).textContent || "";
            var aNum = parseFloat(aText);
            var bNum = parseFloat(bText);
            var result;
            if (!isNaN(aNum) && !isNaN(bNum)) {
                result = aNum - bNum;
            } else {
                result = aText.localeCompare(bText);
            }
            return ascending ? result : -result;
        });

        for (var i = 0; i < rows.length; i++) {
            tbody.appendChild(rows[i]);
        }
    }

    PreviewWindow.prototype.detectTextAndEnableCopy = function () {
        var self = this;
        fetch("/file/" + this.path, { method: "HEAD" })
            .then(function (r) {
                var ct = (r.headers.get("Content-Type") || "").split(";")[0].trim();
                if (ct.indexOf("text/") === 0 || ct === "application/json" ||
                    ct === "application/xml" || ct === "application/javascript") {
                    self.isText = true;
                    if (!self.copyBtnContainer.hasChildNodes()) {
                        var copyBtn = document.createElement("button");
                        copyBtn.className = "btn";
                        copyBtn.title = "Copy to clipboard";
                        copyBtn.innerHTML = '<img src="/assets/icons/clipboard.svg" alt="Copy">';
                        copyBtn.addEventListener("click", function (e) {
                            e.stopPropagation();
                            self.copyToClipboard();
                        });
                        self.copyBtnContainer.appendChild(copyBtn);
                    }
                    return fetch("/file/" + self.path)
                        .then(function (r2) { return r2.text(); })
                        .then(function (text) { self.textContent = text; });
                }
            });
    };

    PreviewWindow.prototype.reload = function () {
        this.loadContent();
        if (this.isText) {
            var self = this;
            fetch("/file/" + this.path)
                .then(function (r) { return r.text(); })
                .then(function (text) { self.textContent = text; });
        }
    };

    PreviewWindow.prototype.showDeleted = function () {
        this.contentEl.innerHTML =
            '<div class="preview-error">File has been deleted.</div>';
    };

    PreviewWindow.prototype.copyToClipboard = function () {
        if (this.textContent !== null) {
            navigator.clipboard.writeText(this.textContent).then(function () {
                showToast("Copied to clipboard");
            });
        }
    };

    PreviewWindow.prototype.close = function () {
        WS.send({ type: "unwatch", path: this.path });
        this.el.remove();
        WindowManager.remove(this);
    };

    PreviewWindow.prototype.setupDrag = function (handle) {
        var self = this;
        var startX, startY, origLeft, origTop;

        handle.addEventListener("pointerdown", function (e) {
            if (e.target.closest(".btn")) return;
            e.preventDefault();
            startX = e.clientX;
            startY = e.clientY;
            origLeft = self.el.offsetLeft;
            origTop = self.el.offsetTop;
            handle.setPointerCapture(e.pointerId);

            function onMove(e) {
                self.el.style.left = (origLeft + e.clientX - startX) + "px";
                self.el.style.top = (origTop + e.clientY - startY) + "px";
            }
            function onUp(e) {
                handle.releasePointerCapture(e.pointerId);
                handle.removeEventListener("pointermove", onMove);
                handle.removeEventListener("pointerup", onUp);
            }
            handle.addEventListener("pointermove", onMove);
            handle.addEventListener("pointerup", onUp);
        });
    };

    PreviewWindow.prototype.setupResize = function (handle) {
        var self = this;

        handle.addEventListener("pointerdown", function (e) {
            e.preventDefault();
            e.stopPropagation();
            var startX = e.clientX;
            var startY = e.clientY;
            var origW = self.el.offsetWidth;
            var origH = self.el.offsetHeight;
            handle.setPointerCapture(e.pointerId);

            function onMove(e) {
                var w = Math.max(200, origW + e.clientX - startX);
                var h = Math.max(100, origH + e.clientY - startY);
                self.el.style.width = w + "px";
                self.el.style.height = h + "px";
            }
            function onUp(e) {
                handle.releasePointerCapture(e.pointerId);
                handle.removeEventListener("pointermove", onMove);
                handle.removeEventListener("pointerup", onUp);
            }
            handle.addEventListener("pointermove", onMove);
            handle.addEventListener("pointerup", onUp);
        });
    };

    // ---- Directory Watcher ----
    var DirWatcher = {
        dirs: {}, // path -> { ul: element, level: number }

        add: function (path, ul, level) {
            this.dirs[path] = { ul: ul, level: level };
        },

        remove: function (path) {
            delete this.dirs[path];
        },

        refresh: function (path) {
            var entry = this.dirs[path];
            if (entry) {
                // Collect expanded descendant paths before refresh
                var expandedChildren = [];
                var prefix = path === "" ? "" : path + "/";
                var allPaths = Object.keys(this.dirs);
                for (var i = 0; i < allPaths.length; i++) {
                    if (allPaths[i] !== path && allPaths[i].indexOf(prefix) === 0) {
                        expandedChildren.push(allPaths[i]);
                    }
                }
                loadDirectory(path, entry.ul, entry.level, expandedChildren);
            }
        },

        getWatchedPaths: function () {
            return Object.keys(this.dirs);
        }
    };

    // ---- WebSocket ----
    var WS = {
        ws: null,
        reconnectDelay: 1000,
        maxDelay: 30000,

        connect: function () {
            var self = this;
            var proto = location.protocol === "https:" ? "wss:" : "ws:";
            this.ws = new WebSocket(proto + "//" + location.host + "/ws");

            this.ws.onopen = function () {
                self.reconnectDelay = 1000;
                // Re-send watch messages for preview windows
                var paths = WindowManager.getWatchedPaths();
                for (var i = 0; i < paths.length; i++) {
                    self.send({ type: "watch", path: paths[i] });
                }
                // Re-send watch_dir messages for expanded directories
                var dirPaths = DirWatcher.getWatchedPaths();
                for (var i = 0; i < dirPaths.length; i++) {
                    self.send({ type: "watch_dir", path: dirPaths[i] });
                }
            };

            this.ws.onmessage = function (e) {
                var msg;
                try { msg = JSON.parse(e.data); } catch (_) { return; }
                switch (msg.type) {
                    case "file_modified":
                    case "file_renamed":
                        WindowManager.reloadByPath(msg.path);
                        break;
                    case "file_deleted":
                        WindowManager.showDeletedByPath(msg.path);
                        break;
                    case "dir_changed":
                        DirWatcher.refresh(msg.path);
                        break;
                }
            };

            this.ws.onclose = function () {
                setTimeout(function () { self.reconnect(); }, self.reconnectDelay);
            };

            this.ws.onerror = function () {
                // onclose will fire after onerror
            };
        },

        reconnect: function () {
            this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxDelay);
            this.connect();
        },

        send: function (msg) {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify(msg));
            }
        }
    };

    // ---- File Tree ----
    function loadDirectory(path, parentUl, level, expandedChildren) {
        fetch("/api/lsdir/" + path)
            .then(function (r) {
                if (!r.ok) return [];
                return r.json();
            })
            .then(function (entries) {
                parentUl.innerHTML = "";
                for (var i = 0; i < entries.length; i++) {
                    var entry = entries[i];
                    var li = document.createElement("li");
                    var div = document.createElement("div");
                    div.className = "dir-entry";
                    div.style.paddingLeft = (8 + level * 20) + "px";

                    var icon = document.createElement("img");
                    icon.className = "icon";

                    if (entry.type === "dir") {
                        icon.src = "/assets/icons/folder.svg";
                        var nameSpan = document.createElement("span");
                        nameSpan.className = "name";
                        nameSpan.textContent = entry.name;

                        div.appendChild(icon);
                        div.appendChild(nameSpan);

                        // Toggle expand/collapse
                        (function (entryPath, li, lv) {
                            div.addEventListener("click", function () {
                                if (li.getAttribute("data-opened") === "true") {
                                    li.setAttribute("data-opened", "false");
                                    var childUl = li.querySelector(".dir-children");
                                    if (childUl) childUl.remove();
                                    WS.send({ type: "unwatch_dir", path: entryPath });
                                    DirWatcher.remove(entryPath);
                                } else {
                                    li.setAttribute("data-opened", "true");
                                    var childUl = document.createElement("ul");
                                    childUl.className = "dir-children";
                                    li.appendChild(childUl);
                                    loadDirectory(entryPath, childUl, lv + 1);
                                    WS.send({ type: "watch_dir", path: entryPath });
                                    DirWatcher.add(entryPath, childUl, lv + 1);
                                }
                            });
                        })(entry.path, li, level);
                    } else {
                        icon.src = "/assets/icons/file.svg";
                        var nameSpan = document.createElement("span");
                        nameSpan.className = "name";
                        nameSpan.textContent = entry.name;

                        div.appendChild(icon);
                        div.appendChild(nameSpan);

                        // Download button
                        var dlBtn = document.createElement("button");
                        dlBtn.className = "action-btn";
                        dlBtn.title = "Download";
                        dlBtn.innerHTML = '<img src="/assets/icons/download.svg" alt="Download">';
                        (function (entryPath) {
                            dlBtn.addEventListener("click", function (e) {
                                e.stopPropagation();
                                var a = document.createElement("a");
                                a.href = "/save/" + entryPath;
                                a.download = "";
                                a.click();
                            });
                        })(entry.path);
                        div.appendChild(dlBtn);

                        // Click to preview
                        (function (entryPath) {
                            nameSpan.addEventListener("click", function (e) {
                                e.stopPropagation();
                                WindowManager.create(entryPath);
                            });
                        })(entry.path);
                    }

                    li.appendChild(div);
                    parentUl.appendChild(li);
                }

                // Re-expand previously expanded subdirectories
                if (expandedChildren && expandedChildren.length > 0) {
                    var expandedSet = {};
                    for (var i = 0; i < expandedChildren.length; i++) {
                        expandedSet[expandedChildren[i]] = true;
                    }

                    // Build a map of entry path -> index for directories in this response
                    var dirEntryIndices = {};
                    for (var i = 0; i < entries.length; i++) {
                        if (entries[i].type === "dir") {
                            dirEntryIndices[entries[i].path] = i;
                        }
                    }

                    var lis = parentUl.querySelectorAll(":scope > li");

                    for (var i = 0; i < entries.length; i++) {
                        if (entries[i].type !== "dir") continue;
                        var entryPath = entries[i].path;
                        if (!expandedSet[entryPath]) continue;

                        // This directory was previously expanded and still exists
                        var li = lis[i];
                        li.setAttribute("data-opened", "true");
                        var childUl = document.createElement("ul");
                        childUl.className = "dir-children";
                        li.appendChild(childUl);

                        // Collect descendant expanded paths for recursive re-expansion
                        var subPrefix = entryPath + "/";
                        var subExpanded = [];
                        for (var j = 0; j < expandedChildren.length; j++) {
                            if (expandedChildren[j] !== entryPath && expandedChildren[j].indexOf(subPrefix) === 0) {
                                subExpanded.push(expandedChildren[j]);
                            }
                        }

                        loadDirectory(entryPath, childUl, level + 1, subExpanded.length > 0 ? subExpanded : undefined);
                        DirWatcher.add(entryPath, childUl, level + 1);
                    }

                    // Clean up expanded paths whose directories no longer exist
                    var prefix = path === "" ? "" : path + "/";
                    for (var i = 0; i < expandedChildren.length; i++) {
                        var childPath = expandedChildren[i];
                        // Find the immediate child directory name
                        var rest = childPath.substring(prefix.length);
                        var slashIdx = rest.indexOf("/");
                        var immediatePath = slashIdx === -1 ? childPath : prefix + rest.substring(0, slashIdx);
                        if (dirEntryIndices[immediatePath] === undefined) {
                            DirWatcher.remove(childPath);
                            WS.send({ type: "unwatch_dir", path: childPath });
                        }
                    }
                }
            });
    }

    // ---- Init ----
    document.addEventListener("DOMContentLoaded", function () {
        var fileTree = document.getElementById("file-tree");
        loadDirectory("", fileTree, 0);
        DirWatcher.add("", fileTree, 0);
        WS.connect();

        var logoutBtn = document.getElementById("logout-btn");
        if (logoutBtn) {
            logoutBtn.addEventListener("click", function () {
                fetch("/logout", { method: "POST" }).then(function () {
                    window.location.href = "/login";
                });
            });
        }
    });
})();
