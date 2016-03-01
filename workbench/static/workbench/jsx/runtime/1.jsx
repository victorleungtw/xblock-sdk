// XBlock runtime implementation.
var RuntimeProvider = React.createClass({
    getRuntime: function(version) {
        if (! this.versions.hasOwnProperty(version)) {
          throw 'Unsupported XBlock version: ' + version;
        }
        return this.versions[version];
    },

    versions: {
        1: {
          handlerUrl: function(block, handlerName, suffix, query) {
            suffix = typeof suffix !== 'undefined' ? suffix : '';
            query = typeof query !== 'undefined' ? query : '';
            var usage = $(block).data('usage');
            var url_selector = $(block).data('url_selector');
            if (url_selector !== undefined) {
                baseUrl = window[url_selector];
            }
            else {baseUrl = handlerBaseUrl;}

            // studentId and handlerBaseUrl are both defined in block.html
            return (baseUrl + usage +
                               "/" + handlerName +
                               "/" + suffix +
                       "?student=" + studentId +
                               "&" + query);
          },
          children: function(block) {
            return $(block).prop('xblock_children');
          },
          childMap: function(block, childName) {
            var children = this.children(block);
            for (var i = 0; i < children.length; i++) {
              var child = children[i];
              if (child.name == childName) {
                return child
              }
            }
          }
      }
  },
  render: function () {
    return (<XBlock getRuntime={this.getRuntime} versions={this.versions} />)
  }
});

var XBlock = React.createClass({
    initializeBlock: function (element) {
        $(element).prop('xblock_children', this.initializeBlocks($(element)));

        var version = $(element).data('runtime-version');
        if (version === undefined) {
            return null;
        }

        var runtime = RuntimeProvider.getRuntime(version);
        var initFn = window[$(element).data('init')];
        var jsBlock;
        if(initFn.length == 2) {
            jsBlock = new initFn(runtime, element) || {};
        } else if (initFn.length == 3) {
            var data = $(".xblock_json_init_args", element).text();
            if (data) data = JSON.parse(data); else data = {};
            jsBlock = new initFn(runtime, element, data) || {};
        }

        jsBlock.element = element;
        jsBlock.name = $(element).data('name');
        return jsBlock;
    },
    initializeBlocks: function (element) {
        return $(element).immediateDescendents('.xblock-v1').map(function(idx, elem) {
            return this.initializeBlock(elem);
        }).toArray();
    };

    render: <thing initializeBlocks={this.initializeBlocks} />
});


var XBlockAsides = React.createClass({

    initializeAside: function (element) {
        var version = $(element).data('runtime-version');
        if (version === undefined) {
            return null;
        }

        var runtime = RuntimeProvider.getRuntime(version);
        var initFn = window[$(element).data('init')];
        var jsBlock;
        // $(element).siblings('div.xblock-v1')[0]
        var block_element = $(element).siblings('[data-usage="'+$(element).data('block_id')+'"]')
        var data = $(".xblock_json_init_args", element).text();
        if (data) data = JSON.parse(data); else data = {};
        jsBlock = new initFn(runtime, element, block_element, data) || {};

        jsBlock.element = element;
        return jsBlock;
    };

    initializeAsides: function (elements) {
        return elements.map(function(idx, elem) {
            return this.initializeAside(elem);
        }).toArray();
    };

    render: function () {
        <thing initializeAsides={this.initializeAsides} />
    };
}());


$(function() {
    // Find all the children of an element that match the selector, but only
    // the first instance found down any path.  For example, we'll find all
    // the ".xblock" elements below us, but not the ones that are themselves
    // contained somewhere inside ".xblock" elements.
    $.fn.immediateDescendents = function(selector) {
        return this.children().map(function(idx, element) {
            if ($(element).is(selector)) {
                return element;
            } else {
                return $(element).immediateDescendents(selector).toArray();
            }
        });
    };

    $('body').on('ajaxSend', function(elm, xhr, s) {
        // Pass along the Django-specific CSRF token.
        xhr.setRequestHeader('X-CSRFToken', $.cookie('csrftoken'));
    });

    XBlock.initializeBlocks($('body'));
    XBlockAsides.initializeAsides($('.xblock_asides-v1'))
});
