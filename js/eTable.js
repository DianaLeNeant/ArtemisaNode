/**
 * Dynamic controls table library.
 *
 * @link   https://github.com/DianaLeNeant/ArtemisaNode
 * @author Diana Celeste Nuño Ramírez. 2018.
 */

function bind_eTables() {
    $('body').find('.editable').each(function() {
        var etable = $(this);
        var edit = (etable.attr('noprev') != undefined ? 'readonly' : '');
        var ths = etable.find('th');
        var eid = etable.attr('id');
        var trs = etable.find('tr');
        var nel = nameGen();

        etable.attr('data-ths', ths.length);
        var prevBtn =  $(this).find(`.${eid}new`).closest('td').closest('tr');
        if (prevBtn.length > 0) {
            console.log(prevBtn);
            $(this).find(`.${eid}new`).closest('td').closest('tr').remove();
        }
        
        trs.each(function() {
            var tr = $(this);
            var tds = $(this).find('td');
            if (tds.length > 0) {
                for (let tdi = 0; tdi < tds.length; tdi++) {
                    var td = tds[tdi];
                    if (td) {
                        var tv = td.innerHTML;
                        var tdType = '<input type="text"';
                        var tdEnd = 'input'
                        var tdData = '';
                        
                        console.log(`${ths} - ${tdi}`);

                        if (ths[tdi].getAttribute('data-type')) {
                            var thst = ths[tdi].getAttribute('data-type').split(':', 2);
                            switch (thst[0]) {
                                case 'list':
                                    tdType = '<select';
                                    tdEnd = 'select'
                                    var dta = thst[1].split(',');
                                    for (let d = 0; d < dta.length; d++) {
                                        var dtaspl = dta[d].split('|');
                                        var nv = dtaspl[0] != '' ? dtaspl[0] : dtaspl[1];
                                        tdData += `<option value="${nv}" ${tv == nv ? 'selected' : ''}>${dtaspl[1]}</option>`;
                                    }
                                    break;
                                case 'textarea':
                                    tdType = '<textarea';
                                    tdEnd = 'textarea'
                                    break;
                                /*case 'auto':
                                    console.log(thst);
                                    var dta = thst[1].split(',');
                                    console.log(dta);
                                    for (let d = 0; d < dta.length; d++) {
                                        var dtaspl = dta[d].split('|');
                                        var nv = String(dtaspl[0]).replace('{time}', new Date().getTime()).replace('{exe}', secureParse(session.info.Nombre)[0]);
                                        tv = nv;
                                    }
                                    break;*/
                            }
                        }

                        if (!tv.includes('<')) {
                            if (tdEnd == 'textarea') {
                                td.innerHTML = `${tdType} name="edI${nameGen()}" class="form-control" ${edit}>${tv}</${tdEnd}>`;
                            } else {
                                td.innerHTML = `${tdType} value="${tv}" name="edI${nameGen()}" class="form-control" ${edit}>${tdData}</${tdEnd}>`;
                            }
                        }
                    }
                }
            }
        });

        var ntds = '';
        for (let t = 1; t < ths.length; t++) {
            ntds += '<td></td>'
        }
        etable.append(`<tr>${ntds}<td><input type="button" value="Añadir elemento" class="${eid}new form-control" /></td></tr>`).find(`.${eid}new`).click(function() {
            var tbl = $(this).closest('td').closest('tr').closest('table');
            var ths = tbl.find('th');
            var nhtml = '<tr>';
            var exV = '';
            for (let t = 0; t < ths.length; t++) {
                var tdType = '<input type="text"';
                var tdEnd = 'input'
                var tdData = '';
                if (ths[t].getAttribute('data-type')) {
                    var thst = ths[t].getAttribute('data-type').split(':', 2);
                    switch (thst[0]) {
                        case 'list':
                            tdType = '<select';
                            tdEnd = 'select'
                            var dta = thst[1].split(',');
                            for (let d = 0; d < dta.length; d++) {
                                var dtaspl = dta[d].split('|');
                                tdData += `<option ${dtaspl[0] != '' ? 'value="' + dtaspl[0] + '"' : 'value="' + dtaspl[1] + '"'}>${dtaspl[1]}</option>`;
                            }
                            break;
                        case 'seeker':
                            tdEnd = 'input'
                            tdType = `<input type="text" class="seeker form-control" data-seek="${thst[1].replace(/\./g, ':')}"`;
                            console.log(thst[1]);
                            console.log(thst[1].replace(/\./g, ':'));
                            break;
                        case 'textarea':
                            tdType = '<textarea';
                            tdEnd = 'textarea';
                            tdData = '';
                            break;
                        case 'auto':
                            console.log(thst);
                            var dta = thst[1].split(',');
                            console.log(dta);
                            for (let d = 0; d < dta.length; d++) {
                                var dtaspl = dta[d].split('|');
                                var nv = String(dtaspl[0]).replace('{time}', '[' + new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString() + ']').replace('{exe}', secureParse(session.info.Nombre)[0] + ' [' + session.loggedAt + ']');
                                exV = nv;
                            }
                            break;
                    }
                }
                nhtml += `<td>${tdType} value="${exV}" name="edI${nameGen()}" class="form-control">${tdData}</${tdEnd}></td>`;
            }
            nhtml += '</tr>';
            $(nhtml).insertBefore($(this).closest('td').closest('tr'));
            bindSeekers();
        })
    });
}
