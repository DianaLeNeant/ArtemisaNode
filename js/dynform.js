/**
 * Dynamic controls library.
 *
 * @link   https://github.com/DianaLeNeant/ArtemisaNode
 * @author Diana Celeste Nuño Ramírez. 2018.
 */

function applyDynForm() {
    var a_source = [];
    var d_source = [];
    var d_load = [];
    var gcount = 0;
    var ids = [];
    $(".dynform").each(
        function() {
            $(this).html('');
            ids.push($(this).attr('id'));
            if ($(this).attr("data-source") != undefined) a_source.push($(this).attr("data-source").split(':'));
            d_load.push($(this).attr("data-load"));
            var item = $(this);
            var catReq = {};
            try {
                catReq = {T: a_source[gcount][0], C: a_source[gcount][1], I: a_source[gcount][2]};
            } catch (error) {

            }
            commandRequest('getCat', catReq, function(rdata) {
                console.log(rdata);
                d_source.push((rdata.result ? rdata.result : ""));

                d_type = item.attr("data-type");
                en = item.attr("data-enabled");

                switch (d_type) {
                    case "files":
                        var ob = item.append("<table data-dync=0 data-dyng='" + gcount + "'><tbody></tbody></table>").find("tbody").append(
                            "<tr><td><input type='button' value='Añadir archivo' class='form-control addf' /></td></tr>").find(".addf");

                        if (en != "false") {
                        ob.on("click",
                            function() {
                                var g = $(this).closest("table").attr("data-dyng");
                                var incr = $(this).closest("table").attr("data-dync");
                                $(this).closest("table").append("<tr><td><input type='file' name='" + ids[g] + incr + "' class='form-control' /></td></tr>");
                                $(this).closest("table").attr("data-dync", (parseInt(incr) + 1).toString());
                            }
                        );}
                        try {
                            var oLoad = (d_load[gcount]);
                            console.log("dyn[f_autoload]");
                            console.log(oLoad);
                            oLoad.forEach(element => {
                                var incr = ob.closest("table").attr("data-dync");
                                ob.closest("table").append("<tr><td><a class='ar' href='" + element +
                                "' id='fil" + incr + " target='_blank'>Ver archivo adjunto</a> <a class='ar' href='#' id='del" + incr +
                                "'>Quitar archivo adjunto</a></td></tr>").find("a#del" + incr).on("click", function() {
                                    // function to delete file... please
                                });
                                ob.closest("table").append("<tr><td><input type='hidden' name='" + ids[g] + incr + "' value='" + element + "' /></td></tr>");
                                ob.closest("table").attr("data-dync", (parseInt(incr) + 1).toString());
                            });
                        } catch (error) {
                            console.log(error.message);
                        }
                    break;
                    case "products":
                        var ob = item.append("<table data-dync=0 data-dyng='" + gcount + "'><tbody></tbody></table>").find("tbody").append(
                            "<tr><td><input type='button' value='Añadir elemento' class='addp form-control' /></td></tr>").find(".addp");
                        if (en != "false") {
                        ob.on("click",
                            function() {
                                var incr = $(this).closest("table").attr("data-dync");
                                var g = $(this).closest("table").attr("data-dyng");
                                var vals = Array();
                                if (a_source[g] != undefined) {
                                    for (var i = 0; i < d_source[g].length; i++) {
                                        vals.push({
                                            value: d_source[g][i][a_source[g][2]],
                                            label: d_source[g][i][a_source[g][1]]
                                        })
                                    }
                                }

                                $(this).closest("table").append("<tr><td><input type='text' name='" + ids[g] + incr + "' class='pr form-control' /></td></tr>").find(".pr").autocomplete(
                                    { source: function (request, response) {
                                            var results = $.ui.autocomplete.filter(vals, request.term);
                                            response(results.slice(0, 20));
                                        }
                                    }
                                );
                                $(this).closest("table").attr("data-dync", (parseInt(incr) + 1).toString());
                            }
                        );
                        }
                        try {
                            var oLoad = (d_load[gcount]);
                            console.log("dyn[p_autoload]");
                            console.log(oLoad);
                            oLoad.forEach(element => {
                                var incr = ob.closest("table").attr("data-dync");
                                var vals = Array();
                                if (a_source[g] != undefined) {
                                    for (var i = 0; i < d_source[g].length; i++) {
                                        vals.push({
                                            value: d_source[g][i][a_source[g][2]],
                                            label: d_source[g][i][a_source[g][1]]
                                        })
                                    }
                                }
                                ob.closest("table").append("<tr><td><input type='text' name='" + ids[g] + incr + "' class='pr form-control' value='" + element + "' /></td></tr>").find(".pr").autocomplete(
                                    { source: function (request, response) {
                                            var results = $.ui.autocomplete.filter(vals, request.term);
                                            response(results.slice(0, 20));
                                        }
                                    }
                                );
                                ob.closest("table").attr("data-dync", (parseInt(incr) + 1).toString());
                            });
                        } catch (error) {
                            console.log(error.message);
                        }
                    break;
                    case "list":
                        var ob = item.append("<table data-dync=0 data-dyng='" + gcount + "'><tbody></tbody></table>").find("tbody").append(
                            "<tr><td><input type='button' value='Añadir elemento' class='addp form-control' /></td></tr>").find(".addp");
                        if (en != "false") {
                        ob.on("click",
                            function() {
                                var incr = $(this).closest("table").attr("data-dync");
                                var g = $(this).closest("table").attr("data-dyng");
                                $(this).closest("table").append("<tr><td><input type='text' name='" + ids[g] + incr + "' class='form-control' /></td></tr>");
                                $(this).closest("table").attr("data-dync", (parseInt(incr) + 1).toString());
                            }
                        );}
                        try {
                            var oLoad = JSON.parse(d_load[gcount]);
                            console.log("dyn[l_autoload]");
                            console.log(oLoad);
                            oLoad.forEach(element => {
                                var incr = ob.closest("table").attr("data-dync");
                                ob.closest("table").append("<tr><td><input type='text' name='" + ids[g] + incr + "' value='" + element + "' class='form-control'/></td></tr>");
                                ob.closest("table").attr("data-dync", (parseInt(incr) + 1).toString());
                            });
                        } catch (error) {
                            console.log(error.message);
                        }
                    break;
                }

                gcount++;
            })
        }
    );
}
