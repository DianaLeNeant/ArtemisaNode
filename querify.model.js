querify('',
        [],
        [],
        id,
        function(status, data) {
            if (status == resultStatus.inserted) {
                response.setMessage('El registro se insertó correctamente.')
            } else if (status == resultStatus.modified){
                response.setMessage('El registro se modificó correctamente.')
            }
            res.send(response.stringify());
        },
        function(status, data) {
            if (status == resultStatus.row_found) {
                response.setMessage('El registro no pudo ser insertado, ya existe una revisión de la misma venta.');
            } else if (status == resultStatus.query_failed){
                response.setMessage('El registro no pudo ser insertado.')
            }
            res.send(response.stringify());
        }, ``);