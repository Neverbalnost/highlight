(function($) {  
    'use strict';

    var hightlightCommentStuff = {
        
        init: function() {
            var scope = hightlightCommentStuff;
            scope.renderMenu();
            scope.controls.content.on('mouseup', this.getRange);
            
            scope.controls.content.on('click', '.delete-button', scope.removeItem)
            
            if (localStorage.savedHighlights) scope.restoreHighlights();
            if (localStorage.savedComments) scope.restoreComments();
        },
        
        restoreRange: function(itemType, dataArr) {
            var scope = hightlightCommentStuff,
                content = scope.controls.content,
                textRange,
                i,
                j,
                range;
            
            for (i = 0; i < dataArr.length; i++) {
                for (j = 0; j < content.children().length; j++) {
                    textRange = itemType == "comment" ? dataArr[i].commentRange : dataArr[i];
                    if ($(content.children()[j]).text().indexOf(textRange) != -1) {
                        range = document.createRange();
                        range.setStart(content.children()[j].firstChild, content.children()[j].firstChild.nodeValue.indexOf(textRange));
                        range.setEnd(content.children()[j].firstChild, content.children()[j].firstChild.nodeValue.indexOf(textRange) + textRange.length);

                        scope.currentSelection = range;
                        if (itemType == "comment") scope.currentCommentText = dataArr[i].commentText;
                        
                        itemType == "comment" ? scope.postComment() : scope.highlight();
                    }                    
                }
            }
        },
        
        restoreHighlights: function() {
            var savedHighlights = JSON.parse(localStorage.savedHighlights),
                scope = hightlightCommentStuff;
                
            localStorage.removeItem('savedHighlights');
            
            scope.restoreRange('highlight', savedHighlights);
        },
        
        restoreComments: function() {
            var savedComments = JSON.parse(localStorage.savedComments),
                scope = hightlightCommentStuff;
                
            localStorage.removeItem('savedComments');
            
            scope.restoreRange('comment', savedComments);
        },
        
        controls: {
            content: $('article'),
            contextMenu: $('#contextMenu'),
            commentArea: $('#commentArea'),
            commentInput: $('#commentInput'),
            commentSubmit: $('#commentSubmit'),
            pageWrapper: $('#page-wrapper'),
            deleteButton: $('.delete-button'),
            deleteButtonHTML: '<span class="delete-button icon-square-cross"></span>'
        },
        
        getSelected: function () {
            var sel;
            if (window.getSelection) {
                sel = window.getSelection();
            } else if (document.getSelection) {
                sel = document.getSelection();
            } else if (document.selection) {
                sel = document.selection.createRange();
            }
            return sel;
        },    

        getRange: function (e) {
            var scope = hightlightCommentStuff,
                selectedText = scope.getSelected(),
                range;

            if (document.selection && !window.getSelection){
                range = selectedText;
                range.pasteHTML("<span class='selectedText'>" + range.htmlText + "</span>");
            } else {
                range = selectedText.getRangeAt(0);

                if (range.commonAncestorContainer.nodeName == "#text" && range.startOffset != range.endOffset) {
                    scope.currentSelection = range;
                    scope.currentX = e.clientX;
                    scope.currentY = e.clientY;
                    
                    scope.showMenu();
                } else if (range.startOffset == range.endOffset) {
                    scope.closeMenu();
                }
            }
        },

        renderMenu: function () {
            var scope = hightlightCommentStuff;
            
            scope.controls.contextMenu.on('click', '.button', function() {
                switch(this.classList[1]) {
                    case 'highlight':
                        scope.highlight();
                        break;
                    case 'comment':
                        scope.showCommentArea();
                        break;
                }
            })
            
            scope.controls.commentSubmit.on('click', function() {
                scope.postComment();
            })
        },
        
        showMenu: function() {
            var scope = hightlightCommentStuff,
                block = scope.controls.contextMenu;
            
            block.css('left', scope.currentX - block.width() * 2).css('top', scope.currentY).show();
        },
        
        closeMenu: function() {
            this.controls.contextMenu.hide();
            this.controls.commentArea.hide();            
        },

        highlight: function () {
            var scope = hightlightCommentStuff,
                range = scope.currentSelection,
                newNode = document.createElement('span'),
                bookmark = document.createElement('span'),
                savedHighlights = localStorage.savedHighlights ? JSON.parse(localStorage.savedHighlights) : [];

            savedHighlights.push(range.toString());
            localStorage.setItem('savedHighlights', JSON.stringify(savedHighlights));
            
            newNode.setAttribute('class', 'selectedText');
            $(bookmark).addClass('saved-highlight').html('<span class="comment-text">You highlighted this passage.</span>' + scope.controls.deleteButtonHTML);
            range.insertNode(bookmark);
            range.surroundContents(newNode);
            scope.controls.contextMenu.hide();
                        
            delete scope.currentSelection;
        },

        showCommentArea: function () {
            var scope = hightlightCommentStuff,
                block = scope.controls.commentArea;
            
            scope.closeMenu();
            block.css('top', scope.currentSelection.startContainer.parentNode.offsetTop);
            block.show();
            
        }, 
        
        postComment: function() {
            var scope = hightlightCommentStuff,
                range = scope.currentSelection,
                commentNode = document.createElement('span'),
                input = scope.controls.commentInput,
                newNode = document.createElement('span'),
                commentBackup,
                savedComments = localStorage.savedComments ? JSON.parse(localStorage.savedComments) : [];
                
            if (scope.currentCommentText) {
                input.val(scope.currentCommentText);
                delete scope.currentCommentText;
            }
            
            commentBackup = {commentRange: range.toString(), commentText: input.val()};
            savedComments.push(commentBackup);
            localStorage.setItem('savedComments', JSON.stringify(savedComments));
            
            $(newNode).addClass('commentedText');
            $(commentNode).addClass('saved-comment').html('<span class="comment-text"><b>Your comment:</b>' + input.val() + '</span>' + scope.controls.deleteButtonHTML);
            range.insertNode(commentNode);
            range.surroundContents(newNode);

            input.val('');
            delete scope.currentCommentText;
            scope.controls.commentArea.hide();
        },
        
        removeItem: function(e) {
            var itemToDelete = $(e.target).parent(),
                parentHighlighted = itemToDelete.parents('.selectedText'),
                parentCommented = itemToDelete.parents('.commentedText');
            
            itemToDelete.remove();
            
            if (parentHighlighted.length > 0) {
                var savedHighlights = JSON.parse(localStorage.savedHighlights),
                    index = savedHighlights.indexOf(parentHighlighted.text());
                    
                savedHighlights.splice(index, 1);
                savedHighlights.length > 0 ? localStorage.setItem('savedHighlights', JSON.stringify(savedHighlights)) : localStorage.removeItem('savedHighlights');
                
                parentHighlighted.replaceWith(parentHighlighted.text());
            } else {
                var savedComments = JSON.parse(localStorage.savedComments),
                    i,
                    index;
                    
                for (i = 0; i<savedComments.length; i++) {
                    if (savedComments[i].commentRange.indexOf(parentCommented.text()) != -1) index = i;
                }
                
                savedComments.splice(index, 1);
                savedComments.length > 0 ? localStorage.setItem('savedComments', JSON.stringify(savedComments)) : localStorage.removeItem('savedComments');
                
                parentCommented.replaceWith(parentCommented.text());
            }
        }
    }
    
    hightlightCommentStuff.init(); 
          
})(jQuery);