var db = require('db');
module.exports = {
    home: 'empleados',
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
            case 'dir':
                callBack({command: 'directory'})
                break;
            case 'empleados':
                queries.push(['SELECT ID, Nombre FROM sucursales {where};', (filter.column == 'Sucursal' ? `Nombre LIKE '%${filter.filter}%'` : ''), 'Sucursal']);
                queries.push(['SELECT ID, Nombre FROM puestos {where};', (filter.column == 'Puesto' ? `Nombre LIKE '%${filter.filter}%'` : ''), 'Puesto']);
                queries.push(['SELECT ID, Nombre, CURP, RFC, NSS, Nacimiento, Sucursal, Puesto, FechaIngreso, Vacaciones, Sueldo, Documentos, Activo FROM empleados WHERE Activo = 1 {where};', (!['Puesto', 'Sucursal'].includes(filter.column)  && filter.column != '' ? `${filter.column} LIKE '%${filter.filter}%'` : '')]);
                db.objectize(queries, true, ['ID', 'Nombre', 'CURP', 'RFC', 'NSS', 'Fecha de Nacimiento', 'Sucursal', 'Puesto', 'Fecha de Ingreso', 'Días de Vacaciones', 'Sueldo', 'Documentos', '¿Actualmente activo?'], 'emplItem admon', 'Nombre', function(ret) {
                    ret.pre = `<button class="action" data-action="form.voidInc">Agregar nueva incidencia</button>
                               <button class="action" data-action="form.newEmpl">Agregar nuevo empleado</button>`;
                    callBack(ret);
                });
                break;
            case 'tel':
                queries.push(['SELECT ID, Nombre FROM empleados {where};', (filter.column == 'Empleado' ? `Nombre LIKE '%${filter.filter}%'` : ''), 'Empleado']);
                queries.push(['SELECT * FROM telefonos {where};', (!['Empleado'].includes(filter.column)  && filter.column != '' ? `${filter.column} LIKE '%${filter.filter}%'` : '')]);
                db.objectize(queries, false, ['ID', 'Empleado', 'Teléfono', 'Número de Serie', 'Estado', 'Fecha de contratación', 'Periodo de meses', 'Equipo', 'Plan', 'Renta', 'IMEI', 'Correo de seguridad', 'Contraseña'], 'telItem admon', 'Empleado', function(ret) {
                    ret.pre = `<button class="action" data-action="form.newTel">Agregar nuevo teléfono</button>`;
                    callBack(ret);
                });
                break;
            case 'inactive':
                queries.push(['SELECT ID, Nombre FROM sucursales {where};', (filter.column == 'Sucursal' ? `Nombre LIKE '%${filter.filter}%'` : ''), 'Sucursal']);
                queries.push(['SELECT ID, Nombre FROM puestos {where};', (filter.column == 'Puesto' ? `Nombre LIKE '%${filter.filter}%'` : ''), 'Puesto']);
                queries.push(['SELECT ID, Nombre, CURP, RFC, NSS, Nacimiento, Sucursal, Puesto, Sueldo, Documentos, Activo FROM empleados WHERE Activo = 0 {where};', (!['Puesto', 'Sucursal'].includes(filter.column)  && filter.column != '' ? `${filter.column} LIKE '%${filter.filter}%'` : '')]);
                db.objectize(queries, true, ['ID', 'Nombre', 'CURP', 'RFC', 'NSS', 'Fecha de Nacimiento', 'Sucursal', 'Puesto', 'Sueldo', 'Documentos', '¿Actualmente activo?'], 'emplItem admon', 'Nombre', function(ret) {
                    callBack(ret);
                });
                break;
            case 'becarios':
                queries.push(['SELECT ID, Nombre FROM sucursales {where};', (filter.column == 'Sucursal' ? `Nombre LIKE '%${filter.filter}%'` : ''), 'Sucursal']);
                queries.push(['SELECT ID, Nombre FROM puestos {where};', (filter.column == 'Puesto' ? `Nombre LIKE '%${filter.filter}%'` : ''), 'Puesto']);
                queries.push(['SELECT ID, Nombre, CURP, RFC, NSS, Nacimiento, Sucursal, Puesto, Sueldo FROM empleados WHERE Puesto="18" {where};', (!['Puesto', 'Sucursal'].includes(filter.column)  && filter.column != '' ? `${filter.column} LIKE '%${filter.filter}%'` : '')]);
                db.objectize(queries, true, ['ID', 'Nombre', 'CURP', 'RFC', 'NSS', 'Fecha de Nacimiento', 'Sucursal', 'Puesto', 'Sueldo'], 'emplItem admon', 'Nombre', function(ret) {
                    ret.pre = `<button class="action" data-action="form.voidInc">Agregar nueva incidencia</button>
                               <button class="action" data-action="form.editEmplB">Agregar nuevo becario</button>`;
                    callBack(ret);
                });
                break;
            case "faltas":
                queries.push(['SELECT ID, Nombre FROM empleados {where};', (filter.column == 'Empleado' ? `Nombre LIKE '%${filter.filter}%'` : ''), 'Empleado']);
                queries.push(['SELECT * FROM faltas {where};', (filter.column == 'Fecha' ? `Fecha BETWEEN '${filter.filter}'` : ''), '']);
                db.objectize(queries, false, ['ID', 'Empleado', 'Justificante', 'Fecha', 'Observación' ], 'incidItem', 'Fecha',function(ret) {
                    ret.pre = '<button class="action" data-action="form.voidInc">Agregar nueva incidencia</button>' +
                                '<button class="action" data-action="dateFilter.faltas.Fecha">Filtro de fechas</button>';
                    callBack(ret);
                });
                break;
            case "vacaciones":
                queries.push(['SELECT ID, Nombre FROM empleados {where};', (filter.column == 'Empleado' ? `Nombre LIKE '%${filter.filter}%'` : ''), 'Empleado']);
                queries.push(['SELECT * FROM vacaciones {where};', (filter.column == 'Fecha' ? `Fecha BETWEEN '${filter.filter}'` : ''), '']);
                db.objectize(queries, false, ['ID', 'Empleado', 'Fecha', 'Días tomados' ], 'vacaItem', 'Fecha',function(ret) {
                    ret.pre = '<button class="action" data-action="dateFilter.vacaciones.Fecha">Filtro de fechas</button>' +
                            '<button class="action" data-action="form.newVacation">Agregar vacaciones</button>';
                    callBack(ret);
                });
                break;
            case 'calc':
                callBack({command: 'vacations'})
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