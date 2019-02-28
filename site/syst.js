var db = require('db');
var moment = require('moment');
var artemisa = require('artemisa');
module.exports = {
    home: 'spadmin',
    current: 'home',
    Page: function(section, callBack, filter = null, userID = 1) {
        var queries = [];
        if (filter == null) {
            filter = {
                column: '',
                filter: ''
            }
        }
        this.current = section;
        switch (section) {
            case 'home':
                this.Home(callBack, filter);
                break;
            case 'notif':
                callBack({command: 'myNotif'})
            break;
            case 'dir':
                callBack({command: 'directory'})
            break;
            case 'restart':
                db.query('SELECT ID, Acceso FROM usuarios;', function(loginRes) {
                    if (moment().hour() > Number(artemisa.consultConfiguration('server', 'dayStart'))) {
                        artemisa.cLog('-----> !!! Day started at ' + Number(artemisa.consultConfiguration('server', 'dayStart')) + '. Users will stay at the same absent status before.');
                        callBack('-----> !!! Day started at ' + Number(artemisa.consultConfiguration('server', 'dayStart')) + '. Users will stay at the same absent status before.');
                        return;
                    } /*
                    if (loginRes) { if (loginRes.length > 0) {
                        for (let x = 0; x < loginRes.length; x++) {
                            if (!String(loginRes[x].Acceso).includes('absent')) {
                                query(`UPDATE usuarios SET Acceso = '${String(loginRes[x].Acceso)};absent' WHERE ID = '${loginRes[x].ID}';`)
                            }
                        }
                        callBack('Users absent status applied.');
                    } else {
                        callBack('No users found.');
                    }} else {
                        callBack('There was an error while processing users.');
                    }*/
                });
            break;
            case 'spadmin':
                queries.push(['SELECT * FROM usuarios {where};', (filter.column == 'De' ? `Nombre LIKE '%${filter.filter}%'` : ''), 'De']);
                queries.push(['SELECT * FROM support {where};', (!['De'].includes(filter.column)  && filter.column != '' ? `${filter.column} LIKE '%${filter.filter}%'` : '')]);
                queries.push(['SELECT * FROM usuarios {where};', (filter.column == 'AtendidoPor' ? `Nombre LIKE '%${filter.filter}%'` : ''), 'AtendidoPor']);
                db.objectize(queries, false, ['ID', 'Emitida por', 'Mensaje', 'Evidencias', 'Atendido por', 'Fecha de emisión'], 'supportItem', 'Fecha de emisión', function(ret) {
                    callBack(ret);
                });
                break;
            case 'aditional':
                callBack({pre: `
                    <button class="action" data-action="form.announce">Emitir anuncio</button>
                    <button class="action" data-action="form.armail">Enviar correo electrónico</button>
                    <button class="action" data-action="iQuery.serverinfo">Estado del servidor</button>
                    <button class="action" data-action="iQuery.logtail">Logtail</button>
                    <button class="action" data-action="iQuery.dblogtail">DB Logtail</button>
                    <button class="action" data-action="iQueryA.logsearch">Búsqueda en LOG</button>
                    <button class="action" data-action="pmtest">PM test</button>
                    <button class="action" data-action="form.sms">SMS masivos</button>
                    <button class="action" data-action="form.encode">Encode</button>
                    <button class="action" data-action="form.decode">Decode</button>
                `})
            break;
            default:
                this.current = 'home';
                break;
        }
    },
    Home: function(resultCallBack, filter = null, userID = 1) {
        this.Page(this.home, resultCallBack, filter, userID);
    }
}