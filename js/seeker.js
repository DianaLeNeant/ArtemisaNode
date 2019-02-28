function bindSeekers(element = null, binder = null) {
    var process = function (sElement) {
        //if (!sElement.is(':visible') && sElement.attr('name') != 'search') return;
        var seek = (binder == null ? sElement.attr('data-seek') : binder);
        if (binder == null && seek == undefined) return;
        var parsed = '';
        var limit = (sElement.attr('data-limit') ? Number(sElement.attr('data-limit')) : 20);
        try {
            parsed = JSON.parse(seek);
        } catch (error) {
            if (seek.constructor === String) {
                parsed = seek.split(':');
            } else {
                parsed = seek;
            }
        }

        if (Array.isArray(parsed)) {
            if (parsed.length > 2) {
                var dat = {T: parsed[0], C: parsed[1], I: parsed[2]};
                if (parsed.length > 3) {
                    if (parsed[3] == 'x') {
                        dat = {T: parsed[0], C: parsed[1], I: parsed[2], W: 'Ejecutivo'};
                    }
                }
                commandRequest('getCat', dat, function(res) {
                    //console.log(res);
                    if (res) {
                        if (res.result) {
                            if (res.result.length > 0) {
                                var vals = Array();
                                for (var i = 0; i < res.result.length; i++) {
                                    if (secureParse(res.result[i][parsed[1]])) {
                                        vals.push({
                                            value: String(res.result[i][parsed[2]]),
                                            label: secureParse(res.result[i][parsed[1]])[0]
                                        })
                                    } else {
                                        vals.push({
                                            value: String(res.result[i][parsed[2]]),
                                            label: res.result[i][parsed[1]]
                                        })
                                    }
                                }
                                sElement.autocomplete(
                                    { source: function (request, response) {
                                            var results = $.ui.autocomplete.filter(vals, request.term);
                                            response(results.slice(0, limit));
                                        },
                                    select: function( event, ui ) {
                                        sElement.attr('title', ui.item.label).attr("data-toggle", "tooltip").attr("data-placement", "right");
                                        sElement.tooltip();
                                    }
                                    }
                                );
                            }
                        }
                    }
                });
            }
        } else {
            var type = parsed.type;
            if (type == 'arr') {
                var vals = Array();
                for (var i = 0; i < parsed.data.length; i++) {
                    if (Array.isArray(parsed.data[i])) 
                    {
                        if (secureParse(parsed.data[i][0])) {
                            vals.push({
                                value: String(parsed.data[i][1]),
                                label: secureParse(parsed.data[i][0])[0]
                            });
                        } else {
                            vals.push({
                                value: String(parsed.data[i][1]),
                                label: parsed.data[i][0]
                            });
                        }
                    } else {
                        var ks = Object.keys(parsed.data[i]);
                        var jnt = '';
                        for (var z = 1; z < ks.length; z++) {
                            jnt += parsed.data[i][ks[z]] + '//';
                        
                        }
                        if (secureParse(jnt)) {
                            vals.push({
                                value: String(parsed.data[i][ks[0]]),
                                label: secureParse(jnt)[0]
                            });
                        } else {
                            vals.push({
                                value: String(parsed.data[i][ks[0]]),
                                label: jnt
                            });
                        }
                    }
                }
                sElement.autocomplete(
                    { source: function (request, response) {
                            var results = $.ui.autocomplete.filter(vals, request.term);
                            response(results.slice(0, limit));
                        },
                        select: function( event, ui ) {
                            sElement.attr('title', ui.item.label).attr("data-toggle", "tooltip").attr("data-placement", "right");
                            sElement.tooltip();
                        }
                    }
                );
            } else if ( type == 'attr' ) {
                var vals = Array();
                console.log('Attribute data filtering');
                $('[' + parsed.data + ']').each(function() {
                    console.log($(this));
                    try {
                        var attr = JSON.parse($(this).attr(parsed.data));
                        var ks = Object.keys(attr);
                        var jnt = '';
                        for (var z = 1; z < ks.length; z++) {
                            jnt += attr[ks[z]] + '//';
                        
                        }
                        if (secureParse(jnt)) {
                            vals.push({
                                value: String(attr[ks[0]]),
                                label: secureParse(jnt)[0]
                            });
                        } else {
                            vals.push({
                                value: String(attr[ks[0]]),
                                label: jnt
                            });
                        }
                    } catch (error) {
                        
                    }
                });
                sElement.autocomplete(
                    { source: function (request, response) {
                            var results = $.ui.autocomplete.filter(vals, request.term);
                            response(results.slice(0, limit));
                        },
                        select: function( event, ui ) {
                            sElement.attr('title', ui.item.label).attr("data-toggle", "tooltip").attr("data-placement", "right");
                            sElement.tooltip();
                        }
                    }
                );
            }
        }
    }
    if (element == null) {
        $('body').find('.seeker').each(function() {
            process($(this));
        });
    } else {
        process(element);
    }
}