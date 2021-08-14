define("ace/mode/doc_comment_highlight_rules",["require","exports","module","ace/lib/oop","ace/mode/text_highlight_rules"], function(require, exports, module) {
"use strict";

var oop = require("../lib/oop");
var TextHighlightRules = require("./text_highlight_rules").TextHighlightRules;

var DocCommentHighlightRules = function() {
    this.$rules = {
        "start" : [ {
            token : "comment.doc.tag",
            regex : "@[\\w\\d_]+" // TODO: fix email addresses
        }, 
        DocCommentHighlightRules.getTagRule(),
        {
            defaultToken : "comment.doc",
            caseInsensitive: true
        }]
    };
};

oop.inherits(DocCommentHighlightRules, TextHighlightRules);

DocCommentHighlightRules.getTagRule = function(start) {
    return {
        token : "comment.doc.tag.storage.type",
        regex : "\\b(?:TODO|FIXME|XXX|HACK)\\b"
    };
};

DocCommentHighlightRules.getStartRule = function(start) {
    return {
        token : "comment.doc", // doc comment
        regex : "\\/\\*(?=\\*)",
        next  : start
    };
};

DocCommentHighlightRules.getEndRule = function (start) {
    return {
        token : "comment.doc", // closing comment
        regex : "\\*\\/",
        next  : start
    };
};


exports.DocCommentHighlightRules = DocCommentHighlightRules;

});

define("ace/mode/ko2note_highlight_rules",["require","exports","module","ace/lib/oop","ace/mode/doc_comment_highlight_rules","ace/mode/text_highlight_rules"], function(require, exports, module) {
    "use strict";

    var oop = require("../lib/oop");
    var DocCommentHighlightRules = require("./doc_comment_highlight_rules").DocCommentHighlightRules;
    var TextHighlightRules = require("./text_highlight_rules").TextHighlightRules;

    var Ko2noteHighlightRules = function() {

	this.$rules = {
            "start" : [
		{
                    token: "comment",
                    regex: "\\(\\*",
                    next: "comment"
		}, {
		    token: "ko2todo",
		    regex: "\\:todo\\:\\s\\[[\\w\\W\\d]+?\\]",
		}, {
		    token: "ko2done",
		    regex: "\\:done\\:\\s\\[[\\w\\W\\d]+?\\]",
		}, {
		    token: "ko2note",
		    regex: "\\:note\\:\\s\\[[\\w\\W\\d]+?\\]",
		}, {
		    token: "ko2info",
		    regex: "\\:info\\:\\s\\[[\\w\\W\\d]+?\\]",
		}, {
		    token: "ko2plan",
		    regex: "\\:plan\\:\\s\\[[\\w\\W\\d]+?\\]",
		}, {
		    token: "ko2date",
		    regex: "\\:date\\:\\s\\[[\\w\\W\\d]+?\\]",
		}, {
		    token: "ko2deadline",
		    regex: "\\:deadline\\:\\s\\[[\\w\\W\\d]+?\\]",
		}, {
		    token: "ko2node",
		    regex: "\\:node\\:\\s\\[[\\w\\W\\d]+?\\]",
		}, {
		    token: "ko2link",
		    regex: "\\:link\\:\\s\\[[\\w\\W\\d]+?\\]",
		}, {
		    token: "ko2exec",
		    regex: "\\:exec\\:\\s\\[[\\w\\W\\d]+?\\]",
		}, {
		    token: "ko2memo",
		    regex: "\\:memo\\:\\s\\[[\\w\\W\\d]+?\\]",
		}
            ],
	    "comment": [
		{
		    token: "comment", // closing comment
		    regex: "\\*\\)",
		    next: "start"
		}, {
		    defaultToken: "comment"
		}
	    ]
	};

    };

    oop.inherits(Ko2noteHighlightRules, TextHighlightRules);
    
    exports.Ko2noteHighlightRules = Ko2noteHighlightRules;
});

define("ace/mode/ko2note",["require","exports","module","ace/lib/oop","ace/mode/text","ace/tokenizer","ace/mode/ko2note_highlight_rules"], function(require, exports, module) {
   "use strict";

   var oop = require("../lib/oop");
   var TextMode = require("./text").Mode;
   var Tokenizer = require("../tokenizer").Tokenizer;

   var Ko2noteHighlightRules = require("./ko2note_highlight_rules").Ko2noteHighlightRules;

   var Mode = function() {
      this.HighlightRules = Ko2noteHighlightRules;
   };
   oop.inherits(Mode, TextMode);

   exports.Mode = Mode;
});                (function() {
                    window.require(["ace/mode/ko2note"], function(m) {
                        if (typeof module == "object" && typeof exports == "object" && module) {
                            module.exports = m;
                        }
                    });
                })();
            