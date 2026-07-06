export const validateRut = (rut) => {
    if (rut == null || rut.length === 0) {
        return true;
    }

    rut = rut.split('.').join('');
    rut = rut.split('-').join('');

    // Valor acumulado para el calculo de la formula del dígito verificador
    let nAcumula = 0;
    // Factor por el cual se debe multiplicar el valor de la posicion
    let nFactor = 2;
    // Digito verificador
    let nDv = 0;
    let nDvReal;
    // Extraemos el ultimo numero o letra que corresponde al verificador
    // La K corresponde a 10
    if (rut.charAt(rut.length - 1).toUpperCase() === 'K' ) {
        nDvReal = 10;
    } else if (rut.charAt(rut.length - 1) === '0' || rut.charAt(rut.length - 1) === 0 ) { // el 0 corresponde a 11
        nDvReal = 11;
    } else {
        nDvReal = rut.charAt(rut.length - 1);
    }
    
    for (let nPos = rut.length - 2; nPos >= 0; nPos--) {
        nAcumula += parseInt(rut.charAt(nPos), 10) * nFactor;
        nFactor++;
        if (nFactor > 7) nFactor = 2;
    }

    nDv = 11 - (nAcumula % 11);
    if (nDv === parseInt(nDvReal, 10)) {
        return true;
    } else {
        return false;
    }
};

export const formatRut = (rut) => {
    if (!rut) return '';
    // Clean all non-alphanumeric (except K)
    let value = rut.replace(/[^0-9kK]/g, '');
    if (value.length === 0) return '';
    if (value.length === 1) return value.toUpperCase();
    
    let body = value.slice(0, -1);
    let dv = value.slice(-1).toUpperCase();
    
    // Format body with dots
    let formattedBody = '';
    while (body.length > 3) {
        formattedBody = '.' + body.slice(-3) + formattedBody;
        body = body.slice(0, -3);
    }
    formattedBody = body + formattedBody;
    
    return `${formattedBody}-${dv}`;
};
