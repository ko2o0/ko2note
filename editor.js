// Koji Ota
// Aug 07, 2021

//
var _config = {};
function config(name) {
    if (arguments.length > 1) {
        _config[name] = arguments[1];
        console.log("config: " + name + "=" + _config[name]);
    }
    return _config[name];
}

const { NOTIMP } = require("dns");
//
const electron = require("electron");
const fs = require("fs");
var path = require("path");

//
electron.ipcRenderer.on("message", function(event, arg) {
    //console.log(event);
    //console.log(arg);
    switch(arg) {
    case "open-browser":
        ko2note.browser.toggle();
        break;
    }
});

//
class Buffer {
    constructor(name) {
        this._name = name;
        this._path = null;
        this._modified = false;
        this._editable = true;
        this._writable = true;
        this._data = null;
    }

    get name() {
        return this._name;
    }

    modified() {
        if (arguments.length > 0) {
            this._modified = arguments[0];
        }
        return this._modified;
    }

    editable() {
        if (arguments.length > 0) {
            this._editable = arguments[0];
        }
        return this._editable;
    }

    writable() {
        if (arguments.length > 0) {
            this._writable = arguments[0];
        }
        return this._writable;
    }

    load() {
        if (arguments.length == 0) {
            return this._data;
        } else {
            let path = arguments[0];
            this._path = path;
            if (fs.existsSync(this._path) == true) {
                // let text = fs.readFileSync("sample.txt", 'utf-8');
                this._data = fs.readFileSync(this._path);
                return this.get();
            } else {
                return null;
            }
        }
    }

    save(data) {
        if (this._writable == false) {
            return;
        }
        fs.writeFileSync(this._path, data);
    }

    set(text) {
        this._data = text;
    }

    get() {
        return this._data;
    }
}

//
class BufferManager {
    constructor() {
        this._buffers = [];
    }

    add(buffer) {
        this._buffers.push(buffer);
    }

    find(name) {
        for(let i=0; i<this._buffers.length; i++) {
            if (this._buffers[i].name == name) {
                return this._buffers[i];
            }
        }
        return null;
    }

    count() {
        return this._buffers.length;
    }

    getAt(i) {
        return this._buffers[i];
    }
}

var buffers = {};
buffers.builtin = new BufferManager();

//
let buf;
buf = new Buffer("0.about");
buf.set(`ko2note

Copyrigh(c) 2021 Koji Ota All Rights Reserved.

This software uses the following software:
 - [ace] https://github.com/ajaxorg/ace
`);
buf.writable(false);
buffers.builtin.add(buf);

//
class BufferConfig extends Buffer {
    constructor(name) {
        super(name);
    }

    save(data) {
        console.log("BufferConfig::save:: data="+data);
        eval(data);
        this._data = data;
    }
}
buf = new BufferConfig("0.config");
buf.set(`
//
config("node.selected", "royalblue");
`);
buf.writable(false);
buffers.builtin.add(buf);

//
var ko2note = {
    config : {
        path: "../../book/",
    },
    widgets: {
        itemlist: null,
        statusbar: null,
        calendar: null,
        overlay: null,
    },
    editor: {
        widget: null,
        loading: false,
        buffer: null,
        manage: function() {
            ko2note.editor.widget = ace.edit("editor");
            ko2note.editor.widget.setTheme("ace/theme/monokai");
            ko2note.editor.widget.session.setMode("ace/mode/ko2note");
            //editor.widget.setKeyboardHandler("ace/keyboard/emacs");
            ko2note.editor.widget.setShowPrintMargin(false);
            ko2note.editor.widget.setOptions({
               fontSize: "10pt"
            });
            ko2note.editor.widget.resize();

            ko2note.editor.widget.on("click", function(e) { // mousedown
                let position = e.editor.getCursorPosition();
                var token = e.editor.session.getTokenAt(position.row, position.column);

                ko2note.expand(token);
            
                /*
                // add highlight for the clicked token
                var range = new Range(pos.row, token.start, pos.row, token.start + token.value.length)
                console.log(range)
                editor.session.removeMarker(markerId)
                markerId = editor.session.addMarker(range, 'ace_bracket red')
                */
            });

            ko2note.editor.widget.on("change", function() {
                if (ko2note.editor.loading == false) {
                    if (ko2note.editor.buffer != null) {
                        ko2note.editor.buffer.modified(true);
                        ko2note.show_message(ko2note.buffer.name + " was modified.");
                    }
                }
            });

            ko2note.editor.widget.commands.addCommands([
                {
                   name: "save",
                   bindKey: { win: "Ctrl-S", mac: "Command-S" },
                   exec: function(ed) {
                       ko2note.editor.save();
                       console.log("saving...");
                   }
                }, {
                    name: "extension",
                    bindKey: { win: "Ctrl-;", mac: "Command-;"},
                    exec: function(ed) {
                        ko2note.input_string();
                    }
                }, {
                    name: "execute",
                    bindKey: { win: "Ctrl-E", mac: "Command-E"},
                    exec: function(ed) {
                        let position = ko2note.editor.widget.getCursorPosition();
                        var token = ko2note.editor.widget.session.getTokenAt(position.row, position.column);
                        ko2note.expand(token);
                    }
                }
            ]);

            /*
            ko2note.editor.widget.keyBinding.addKeyboardHandler(function(data, hashId, keyString, keyCode) {
                console.log(require("ace/lib/keys").KEY_MODS[hashId] + keyString);
                return { command: "null" }
            });
            */
        },
        modified: function() {
            if (ko2note.editor.buffer != null) {
                return ko2note.editor.buffer.modified();
            } else {
                return false;
            }
        },
        load: function(buffer) {
            ko2note.editor.loading = true;
            ko2note.editor.buffer = buffer;
            let data = new String( buffer.load() );
            if (data == null) {
                data = "";
            }
            ko2note.editor.widget.setValue(data, -1);
            ko2note.editor.loading = false;
            ko2note.editor.buffer.modified(false);
            ko2note.show_message(ko2note.buffer.name + " was loaded.");
        },
        save: function() {
            if (ko2note.editor.buffer == null) {
                return;
            }
            if (ko2note.editor.buffer.modified() == false) {
                return;
            }
            let data = ko2note.editor.widget.getValue();
            ko2note.editor.buffer.save(data.toString());
            ko2note.editor.buffer.modified(false);
            ko2note.show_message(ko2note.buffer.name + " was saved.");
            ko2note.items.refresh();
        },
    },
    buffer: null,
    items: {
        nodes: [],
        needs_to_refresh: true, // 初回は更新する
        validate: function() {
            ko2note.items.needs_to_refresh = false;
        },
        invalidate: function() {
            ko2note.items.needs_to_refresh = true;
        },
        refresh: function() {
            if (ko2note.items.needs_to_refresh == false) {
                return;
            }

            ko2note.items.nodes = [];
            ko2note.widgets.itemlist.innerHTML = ""; // 子要素クリア

            // ビルトインバッファ
            for(let i=0; i<buffers.builtin.count(); i++) {
                let buf = buffers.builtin.getAt(i);
                let node = document.createElement("div");
                node.className = "clickable";
                node.id = buf.name;
                node.innerHTML = buf.name;
                ko2note.items.nodes.push(node);
                ko2note.widgets.itemlist.appendChild(node); // 子要素追加
                node.addEventListener("click", function(e) {
                    ko2note.items.select(buf.name);
                });
            }

            // フォルダ
            const dirents = fs.readdirSync(ko2note.config.path, {withFileTypes: true});
            if (dirents.length > 0) {
                for(let i=0; i<dirents.length; i++) {
                    let de = dirents[i];
                    if (de.isDirectory()) {

                    } else {
                        let node = document.createElement("div");
                        node.className = "clickable";
                        node.id = de.name;
                        node.innerHTML = de.name;
                        ko2note.items.nodes.push(node);
                        ko2note.widgets.itemlist.appendChild(node); // 子要素追加
                        node.addEventListener("click", function(e) {
                            ko2note.items.select(de.name);
                        });
                    }
                }
            }

            ko2note.items.needs_to_refresh = false;
        },
        find_node: function(name) {
            for(let i=0; i<ko2note.items.nodes.length; i++) {
                if (name == ko2note.items.nodes[i].id) {
                    return ko2note.items.nodes[i];
                }
            }
            return null;
        },
        select: function(name) {
            if (ko2note.buffer != null) { // すでに編集中のバッファがある
                if (ko2note.editor.modified()) { // 修正済であれば保存する
                    ko2note.editor.save();
                }
                ko2note.items.unselect(ko2note.buffer.name);
            }

            // 指定項目を選択
            let node = ko2note.items.find_node(name);
            if (node != null) {
                node.style.backgroundColor = "royalblue";
            }

            // 指定項目をエディタに読み込み
            let buf = buffers.builtin.find(name); // ビルトインバッファを確認する
            if (buf == null) { // ファイルから読みだす
                buf = new Buffer(name);
                buf.load(ko2note.config.path + buf.name);
            }

            ko2note.buffer = buf;
            ko2note.editor.load(ko2note.buffer);
        },
        unselect: function(name) {
            let node = ko2note.items.find_node(name);
            if (node != null) {
                node.style.backgroundColor = "";
            }

            ko2note.buffer = null; // バッファを消去
        },
    },
    expand: function(item) {
        if (item == null) {
            return;
        }

        if (typeof(item.value) == "undefined") {
            return;
        }
        
        let result = item.value.match(/\:(\w+)\:/gi);
        console.log(result);
        if (result.length > 0) {
            let s = item.value.indexOf("[");
            let e = item.value.indexOf("]");
            if ((s >= 0) && (e >= 0)) {
                let ref = item.value.substring(s+1, e);
                switch(result[0]) {
                case ":exec:":
                    console.log("exec: " + ref);
                    ko2note.show_message("Execute: " + ref);
                    break;
                case ":link:":
                    console.log("link: " + ref);
                    if (fs.existsSync(ref)) {
                        electron.shell.openPath(path.resolve(ref)); // folder
                    } else {
                        //electron.shell.openExternal(ref); // url
                        ko2note.browser.load(ref);
                    }
                    ko2note.show_message("Execute: " + ref);
                    break;
                case ":node:":
                    console.log("node: " + ref);
                    ko2note.items.validate(); // 一旦更新不要にする
                    if (ko2note.items.find_node(ref) == null) {
                        ko2note.items.invalidate(); // もし新規だったら要更新
                    }
                    ko2note.items.select(ref);
                    break;
                }
            }
        }
    },
    show_message(message) {
        ko2note.widgets.statusbar.innerHTML = message;
    },
    input_string() {
        let input = document.createElement("input");
        input.id = "input";
        input.type = "text";
        input.placeholder = "input command ...";
        ko2note.widgets.statusbar.innerHTML = "";
        ko2note.widgets.statusbar.appendChild(input);
        input.focus();
        input.addEventListener("change", (function(text_node) {
            return function(e) {
                let command = text_node.value;
                console.log("command: " + command);
                ko2note.editor.widget.focus();
                ko2note.widgets.statusbar.innerHTML = "";
                // does command
                switch(command) {
                case "calendar":
                    ko2note.calendar.show();
                    break;
                }
            };
        })(input));
        console.log("input_string end.");
    },
    calendar: {
        widget: null,
        cursor: {
            year: null,
            month: null
        },
        today: {
            year: null,
            month: null,
            day: null,
        },
        cells: [],
        show: function() {
            if (ko2note.calendar.widget == null) {
                ko2note.calendar.create();
            }
            ko2note.widgets.itemlist.innerHTML = ""; // delete children elements.
            ko2note.widgets.itemlist.appendChild(ko2note.calendar.widget);
            ko2note.calendar.widget.style.display = "block";
            ko2note.calendar.widget.style.visibility = "visible";
            ko2note.calendar.today();
        },
        hide: function() {
            ko2note.calendar.widget.style.display = "none";
            ko2note.calendar.widget.style.visibility = "hidden";
            ko2note.widgets.itemlist.innerHTML = ""; // delete children elements.
            ko2note.items.invalidate();
            ko2note.items.refresh();
        },
        create: function() {
            ko2note.calendar.widget = document.getElementById("calendar");

            document.getElementById("calendar_prev").addEventListener("click", function(e) {
                ko2note.calendar.prev();
            });
            document.getElementById("calendar_today").addEventListener("click", function(e) {
                ko2note.calendar.today();
            });
            document.getElementById("calendar_next").addEventListener("click", function(e) {
                ko2note.calendar.next();
            });
            document.getElementById("calendar_close").addEventListener("click", function(e) {
                ko2note.calendar.hide();
            });

            for(let i=0; i<35; i++) {
                ko2note.calendar.cells.push( document.getElementById("d" + i) );
            }
        },
        today: function() {
            if (ko2note.calendar.today.year == null) { // first time
                let d = new Date();
                ko2note.calendar.today.year = d.getFullYear(); //YYYY
                ko2note.calendar.today.month = d.getMonth() + 1; // 1-12
                ko2note.calendar.today.day = d.getDate(); // 1-31
            }
            ko2note.calendar.cursor.year = ko2note.calendar.today.year;
            ko2note.calendar.cursor.month = ko2note.calendar.today.month;
            ko2note.calendar.reconfigure();
        },
        next: function() {
            ko2note.calendar.cursor.month++;
            if (ko2note.calendar.cursor.month >= 13) {
                ko2note.calendar.cursor.month = 1;
                ko2note.calendar.cursor.year++;
            }
            ko2note.calendar.reconfigure();
        },
        prev: function() {
            ko2note.calendar.cursor.month--;
            if (ko2note.calendar.cursor.month < 0) {
                ko2note.calendar.cursor.month = 12;
                ko2note.calendar.cursor.year--;
            }
            ko2note.calendar.reconfigure();
        },
        reconfigure: function() {
            let firstDay = new Date(ko2note.calendar.cursor.year, ko2note.calendar.cursor.month - 1, 1).getDay();
            let ndays = (new Date(ko2note.calendar.cursor.year, ko2note.calendar.cursor.month - 1, 0)).getDate();
            for(let d=0; d<35; d++) {
                ko2note.calendar.cells[d].innerHTML = "";
            }
            for(let d=0; d<ndays; d++) {
                ko2note.calendar.cells[firstDay + d].innerHTML = d + 1;
            }
            document.getElementById("calendar_title").innerHTML = ko2note.calendar.cursor.year + "/" + ko2note.calendar.cursor.month;
        }
    },
    browser: {
        browsing : false,
        toggle: function() {
            let e = document.getElementById("view");
            if (ko2note.browser.browsing == false) {
                e.style.display = "block";
                e.style.visibility = "visible";
                ko2note.browser.browsing = true;
            } else {
                e.style.display = "none";
                e.style.visibility = "hidden";
                ko2note.browser.browsing = false;
            }
        },
        load: function(url) {
            document.getElementById("view").src = url;
        }
    },
    onload: function() {
        ko2note.widgets.itemlist = document.getElementById("itemlist");
        ko2note.widgets.statusbar = document.getElementById("statusbar");

        ko2note.editor.manage(); // 画面表示
        ko2note.items.refresh(); // 項目表示
        ko2note.items.select("main"); // 初期項目表示
    }
};

//
window.addEventListener('DOMContentLoaded', function() {
    // test
    const data = electron.ipcRenderer.sendSync("message", "from renderer");
    console.log("renderer:" + data);

    //
    ko2note.onload();
});

