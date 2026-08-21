////////////////////////////////Definiciones para clases/////////////////////////////////////////
"use strict";
function _typeof(obj) {
    if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
        _typeof = function _typeof(obj) {
            return typeof obj;
        };
    } else {
        _typeof = function _typeof(obj) {
            return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
        };
    }
    return _typeof(obj);
}
function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
        throw new TypeError("Cannot call a class as a function");
    }
}

function _defineProperty(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });
    } else {
        obj[key] = value;
    } return obj;
}

/////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////
// prototype

// capitalize
//Capitaliza la primera letra de un string    
if (!String.prototype.capitalize) {
    String.prototype.capitalize = function () {
        return this.charAt(0).toUpperCase() + this.slice(1).toLowerCase();
    };
}

// capitalizeAll
//Capitaliza cada palabra de un string (opcional omitir conectores)    
if (!String.prototype.capitalizeAll) {
    String.prototype.capitalizeAll = function (scon = false) {
        let palabras = this.split(" ");
        let res = '';
        _.each(palabras, function (idx, val) {
            if (!scon || val.length > 3)
                res += val.capitalize() + " ";
            else
                res += val.toLowerCase() + " ";
        });
        return res.trim();
    };
}

// endsWith
//hay navegadores que no contienen el prototipo replaceAll, se verifica y se agrega si no existe    
if (!String.prototype.endsWith) {
    String.prototype.endsWith = function (q) {
        var strT = this.substr(this.length - q.length);
        if (q === strT)
            return true;
        else
            return false;
    };
}

// in_array
//agregamos in_array para los strings
String.prototype.in_array = function (arr) {
    var Std = false;
    var str = this;
    _.each(arr, function (idx, val) {
        if (val == str) {
            Std = true;
            return false;
        }
    });
    return Std;
};

if (!Element.prototype.matches) {
    Element.prototype.matches =
        (Element.prototype).matchesSelector ||
        (Element.prototype).mozMatchesSelector ||
        (Element.prototype).msMatchesSelector ||
        (Element.prototype).oMatchesSelector ||
        (Element.prototype).webkitMatchesSelector ||
        function (s) {
            var matches = (this.document || this.ownerDocument).querySelectorAll(s),
                i = matches.length;
            while (--i >= 0 && matches.item(i) !== this) { }
            return i > -1;
        };
}

// pad_left
//Llenar de x caracter a la izquierda  
String.prototype.pad_left = function (len, c) {
    var s = this, c = c || '0';
    while (s.length < len) s = c + s;
    return s;
};

// pad_right
//Llenar de x caracter a la derecha  
String.prototype.pad_right = function (len, c) {
    var s = this, c = c || '0';
    while (s.length < len) s += c;
    return s;
};

// replaceAll
//hay navegadores que no contienen el prototipo replaceAll, se verifica y se agrega si no existe    
if (!String.prototype.replaceAll) {
    String.prototype.replaceAll = function (fnd, rpl) {
        var strO = this;
        while (strO.indexOf(fnd) > -1) {
            strO = strO.replace(fnd, rpl);
        }
        return strO;
    };
}

// startsWith
//hay navegadores que no contienen el prototipo replaceAll, se verifica y se agrega si no existe    
if (!String.prototype.startsWith) {
    String.prototype.startsWith = function (q) {
        var strT = this.substr(0, q.length);
        if (q === strT)
            return true;
        else
            return false;
    };
}

// toFloat
//devuelve un float de un número, quitándole los caracteres
String.prototype.toFloat = function () {
    var Negativo = (String(this).substr(0, 1) == '-');
    var Vl = String(this).replace(/[^0-9.]+/g, "");
    if (Negativo) Vl = "-" + Vl;
    Vl = parseFloat(Vl);
    return Vl;
};

// toNumber
//devuelve un int de un número, quitándole los caracteres
String.prototype.toNumber = function () {
    var Negativo = (String(this).substr(0, 1) == '-');
    var Vl = String(this).replace(/[^0-9.]+/g, "");
    if (Negativo) Vl = "-" + Vl;
    Vl = parseInt(Vl);
    return Vl;
};

// toFormat
//devuelve un string de un número formateándolo
String.prototype.toFormat = function (dec, sgn) {
    return (Number(String(this).replace(/[^0-9.]+/g, "")).toFormat(dec, sgn));
};

// toFormat
//devuelve un string de un número formateándolo
Number.prototype.toFormat = function (dec, sgn) {
    var Negativo = this < 0;
    var vlSP = String(this).replace(/[^0-9.]+/g, "").split('.');
    var Amnt = vlSP[0];
    var nAmnt = "";
    var cntAmntPos = 0;
    for (var i = Amnt.length - 1; i >= 0; i--) {
        if (cntAmntPos >= 3) {
            cntAmntPos = 0;
            nAmnt = "," + nAmnt;
        }
        nAmnt = Amnt.charAt(i) + nAmnt;
        cntAmntPos++;
    }
    if (Negativo) nAmnt = "-" + nAmnt;
    if (dec) {
        var TDec = "0";
        if (vlSP[1])
            TDec = vlSP[1];
        while (1) {
            if (String(TDec).length > dec) {
                var lt = String(TDec).substr(TDec.length - 1);
                TDec = String(TDec).substr(0, TDec.length - 1);
                var lt2 = Number(String(TDec).substr(TDec.length - 1));
                TDec = String(TDec).substr(0, TDec.length - 1);
                if (lt >= 5)
                    lt2 += 1;
                TDec += "" + lt2;
            } else {
                break;
            }
        }

        TDec = String(TDec).pad_right(dec, "0");
        nAmnt += "." + TDec;
    }


    if (sgn)
        nAmnt = sgn + " " + nAmnt;
    return nAmnt;
};

if (!String.prototype.trim) {
    String.prototype.trim = function () {
        var rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g;
        return this.replace(rtrim, '');
    };
}

/////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////
// Abreviaciones
var _LexxPrivObj = function _LexxPrivObj() {
    _classCallCheck(this, _LexxPrivObj);
    _defineProperty(this, "Obj", null);
    _defineProperty(this, "calObj", null);
    _defineProperty(this, "Animacion", null);
    _defineProperty(this, "_LexxPrivObj", true);

    _defineProperty(this, "addClass", function (q) {
        var clsDT = q.split(" ");
        var Elm = this.Obj;
        Object.keys(Elm).forEach(function (k) {
            if (!isNaN(k)) {
                Object.keys(clsDT).forEach(function (ck) {
                    Elm[k].classList.add(clsDT[ck]);
                    var nEv = new Event("classAdded");
                    nEv.className = clsDT[ck];
                    nEv.element = Elm[k];
                    Elm[k].dispatchEvent(nEv);
                    document.dispatchEvent(nEv);
                });
            }
        });
        return this;
    });

    _defineProperty(this, "animate", function (c) {
        var Elm = this.Obj;
        Object.keys(this.Obj).forEach(function (k) {
            if (!isNaN(k)) {
                if (c.scrollTop != undefined) {
                    if (Elm[k].scrollTop != undefined) {
                        Elm[k].style['scroll-behavior'] = 'smooth';
                        Elm[k].scrollTop = c.scrollTop;
                    }
                }
                if (c.scrollLeft != undefined) {
                    if (Elm[k].scrollLeft != undefined) {
                        Elm[k].style['scroll-behavior'] = 'smooth';
                        Elm[k].scrollLeft = c.scrollLeft;
                    }
                }
            }
        });
        return this;
    });

    _defineProperty(this, "append", function (c) {
        if (c.Obj)
            this.Obj[0].appendChild(c.Obj[0]);
        else {
            var tn = document.createTextNode(c);
            this.Obj[0].appendChild(tn);
        }
        return this;
    });

    _defineProperty(this, "attr", function (a, v) {
        if (v == undefined) {
            return this.Obj[0].getAttribute(a);
        } else {
            var Elm = this.Obj;
            Object.keys(this.Obj).forEach(function (k) {
                if (!isNaN(k)) Elm[k].setAttribute(a, v);
            });
            return this;
        }
    });

    _defineProperty(this, "buzz", function (o, f) {
        var Elm = this.Obj;
        Object.keys(this.Obj).forEach(function (k) {
            if (!isNaN(k))
                _.buzz(Elm[k], o, f, true);
        });
    });

    _defineProperty(this, "calendar", function (c) {
        this.each(function (idx, ob) {
            this.calObj = new _Calendario(ob, c);
        });
        return this.Obj;
    });

    _defineProperty(this, "dbcalendar", function (c) {
        this.each(function (idx, ob) {
            this.calObj = new _CalendarioDoble(ob, c);
        });
        return this.Obj;
    });

    _defineProperty(this, "children", function () {
        return _.querySelectorAll(this.Obj[0].childNodes);
    });

    _defineProperty(this, "click", function () {
        var Elm = this.Obj;
        Object.keys(this.Obj).forEach(function (k) {
            if (!isNaN(k)) {
                Elm[k].attr('lad', Elm[k].click());
            }
        });
        return this;
    });

    _defineProperty(this, "css", function (a, v) {
        if (v == undefined) {
            return this.Obj[0].style[a];
        } else {
            var Elm = this.Obj;
            Object.keys(this.Obj).forEach(function (k) {
                if (!isNaN(k)) Elm[k].style[a] = v;
            });
            return this;
        }
    });

    _defineProperty(this, "child", function (c) {
        var ChlN = this.Obj[0].childNodes[c];
        return ChlN ? _.querySelectorAll([ChlN]) : null;
    });

    _defineProperty(this, "cursorFin", function (q) {
        if (_typeof(window.getSelection) != "undefined"
            && _typeof(document.createRange) != "undefined") {
            var range = document.createRange();
            range.selectNodeContents(this);
            range.collapse(false);
            var sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
        } else if (_typeof(document.body.createTextRange) != "undefined") {
            var textRange = document.body.createTextRange();
            textRange.moveToElementText(this);
            textRange.collapse(false);
            textRange.select();
        }
        return this;
    });

    _defineProperty(this, "each", function (f) {
        _.each(this.Obj, f, true);
        return this;
    });

    _defineProperty(this, "editable", function (q) {
        var Elm = this.Obj;
        Object.keys(this.Obj).forEach(function (k) {
            if (!isNaN(k)) {
                if (!Elm[k].attr('contenteditable')) {
                    Elm[k].addClass('Lexx_Global_Editable_Contenido');
                    Elm[k].attr('contenteditable', true);
                    _.addEventListener(Elm[k], 'input', function () {
                        const clean = this.innerHTML.replace(/<br\s*\/?>|&nbsp;|\s+/gi, '').trim();
                        if (clean === '') this.innerHTML = '';
                    });

                    if (_typeof(q) == 'object') {
                        if (q.type) {
                            Elm[k].attr('inputmode', q.type);
                            if (q.type == 'password') {
                                Elm[k].attr('spellcheck', false);
                            }
                        }
                        if (q.placeholder) Elm[k].attr('placeholder', q.placeholder);
                        if (q.readonly) Elm[k].attr('contenteditable', false);
                    }
                    if (!q || !q.MultiLineHtml)
                        Elm[k].on("paste", function () {
                            var cOb = Elm[k];
                            setTimeout(function () {
                                cOb.Obj[0].text(cOb.Obj[0].text().trim());
                            }, 1);
                        });
                    if (!q || (!q.MultiLine && !q.MultiLineHtml))
                        Elm[k].on("keypress", function (e) {
                            var keyCode = e.keyCode || e.which || e.key;
                            if (keyCode === 13) e.preventDefault();
                        }, { passive: false });
                    if (q && q.numberformat)
                        _.inputFormatting(Elm[k]);

                    Elm[k].on("DOMCharacterDataModified", function () {
                        var cOb = Elm[k];
                        setTimeout(function () {
                            cOb.Obj[0].dispatchEvent(new Event('change'));
                        }, 1);
                    });
                }
            };
        });
        return this;
    });

    _defineProperty(this, "fadeIn", function (t, f) {
        if (t == undefined) t = 400;
        t = t / 1000;
        this.css('transition', '');
        this.css('opacity', '0');
        this.css('display', 'block');
        var cOb = this;
        setTimeout(function () {
            cOb.css('transition', 'opacity ' + t + 's');
            cOb.css('opacity', '1');
            cOb.Obj[0].addEventListener('transitionend', f);
        }, 10);
        return this;
    });

    _defineProperty(this, "fadeOut", function (t, f) {
        if (t == undefined) t = 400;
        t = t / 1000;
        this.css('transition', '');
        this.css('opacity', '1');
        this.css('display', 'block');
        var cOb = this;
        setTimeout(function () {
            cOb.css('transition', 'opacity ' + t + 's');
            cOb.css('opacity', '0');
            var elF = function () {
                _(cOb).hide();
                cOb.Obj[0].removeEventListener('transitionend', elF);
                cOb.Obj[0].removeEventListener('transitionend', f);
            };
            cOb.Obj[0].addEventListener('transitionend', f);
            cOb.Obj[0].addEventListener('transitionend', elF);
            return cOb;
        }, 10);
    });

    _defineProperty(this, "files", function (q) {
        if (q) {
            return this.Obj[0].files[q];
        } else {
            return this.Obj[0].files;
        }
    });

    _defineProperty(this, "find", function (q) {
        if (_typeof(q) === 'string') {
            q = q.replaceAll(':selected', ':checked');
            var fndOb = _.querySelectorAll(this.Obj[0].querySelectorAll(q));
            return fndOb;
        } else {
            return _typeof(q);
        }
    });

    _defineProperty(this, "focus", function () {
        var Elm = this.Obj;
        Object.keys(this.Obj).forEach(function (k) {
            if (!isNaN(k))
                Elm[k].focus();
        });
        return this;
    });

    _defineProperty(this, "hasClass", function (q) {
        return this.Obj[0].classList.contains(q);
    });

    _defineProperty(this, "hide", function () {
        var Elm = this.Obj;
        Object.keys(this.Obj).forEach(function (k) {
            if (!isNaN(k)) {
                Elm[k].attr('lad', Elm[k].css('display'));
                Elm[k].css('display', 'none');
            }
        });
        return this;
    });

    _defineProperty(this, "html", function (q, outer) {
        if (q == undefined || q == null) {
            if (outer)
                return this.Obj[0].outerHTML;
            else
                return this.Obj[0].innerHTML;
        } else {
            var Elm = this.Obj;
            Object.keys(this.Obj).forEach(function (k) {
                if (!isNaN(k)) {
                    Elm[k].innerHTML = q;
                    var fEl = Elm[k].find('script');
                    if (fEl)
                        fEl.each(function () {
                            eval(this.html());
                        });
                }
            });
            return this;
        }
    });

    _defineProperty(this, "index", function (q) {
        if (q == undefined) {
            if (this.Obj[0] instanceof HTMLSelectElement)
                return this.Obj[0].selectedIndex;
            else
                return 0;
        } else {
            var Elm = this.Obj;
            Object.keys(this.Obj).forEach(function (k) {
                if (!isNaN(k)) {
                    if (Elm[k] instanceof HTMLSelectElement)
                        Elm[k].selectedIndex = q;
                }
            });
            return this;
        }
    });

    _defineProperty(this, "is", function (q) {
        if (_typeof(q) === 'string') {
            if (q == ":checked") {
                return this.Obj[0].checked;
            } else if (q == ":visible") {
                return this.Obj.isVisible();
            }
        } else {
            return _typeof(q);
        }
    });

    _defineProperty(this, "isVisible", function () {
        var rect = this.Obj[0].getBoundingClientRect();
        return rect.bottom > 0 &&
            rect.right > 0 &&
            rect.left < (window.innerWidth || document.documentElement.clientWidth) &&
            rect.top < (window.innerHeight || document.documentElement.clientHeight);
    });

    _defineProperty(this, "numberFormat", function () {
        _.addEventListener(this.Obj[0], 'keyup paste', function () {
            var Nb = "";
            if (this instanceof HTMLInputElement)
                Nb = this.val();
            else
                Nb = this.text();

            var Negativo = String(Nb).startsWith('-');
            var Amnt = String(Nb).replace(/[^0-9]+/g, "");
            var nAmnt = "";
            var cntAmntPos = 0;
            for (var i = Amnt.length - 1; i >= 0; i--) {
                if (cntAmntPos >= 3) {
                    cntAmntPos = 0;
                    nAmnt = "." + nAmnt;
                }
                nAmnt = Amnt.charAt(i) + nAmnt;
                cntAmntPos++;
            }
            if (Negativo) nAmnt = "-" + nAmnt;

            if (this instanceof HTMLInputElement)
                this.val(nAmnt);
            else
                this.text(nAmnt);
            this.cursorFin();
        });
        return this;
    });

    _defineProperty(this, "on", function (q, f, o) {
        var Elm = this.Obj;
        Object.keys(this.Obj).forEach(function (k) {
            if (!isNaN(k)) {
                _.addEventListener(Elm[k], q, f, o);
            }
        });
        return this;
    });

    _defineProperty(this, "onlynumbers", function () {
        return this.onlyNumbers();
    });

    _defineProperty(this, "onlyNumbers", function () {
        var Elm = this.Obj;
        Object.keys(this.Obj).forEach(function (k) {
            if (!isNaN(k)) {
                _.addEventListener(Elm[k], 'keyup', function () {
                    if (this instanceof HTMLInputElement)
                        this.val(this.val().replace(/[^0-9]+/g, ""));
                    else
                        this.text(this.text().replace(/[^0-9]+/g, ""));
                    this.cursorFin();
                });
                _.addEventListener(Elm[k], 'paste', function () {
                    if (this instanceof HTMLInputElement)
                        this.val(this.val().replace(/[^0-9]+/g, ""));
                    else
                        this.text(this.text().replace(/[^0-9]+/g, ""));
                    this.cursorFin();
                });
            }
        });
        return this;
    });

    _defineProperty(this, "onlyaz", function () {
        this.onlyAZ();
    });

    _defineProperty(this, "onlyAZ", function () {
        var Elm = this.Obj;
        Object.keys(this.Obj).forEach(function (k) {
            if (!isNaN(k)) {
                _.addEventListener(Elm[k], 'keyup', function () {
                    if (this instanceof HTMLInputElement)
                        this.val(this.val().replace(/[^A-Za-z\s]+/g, ""));
                    else
                        this.text(this.text().replace(/[^A-Za-z\s]+/g, ""));
                    this.cursorFin();
                });
                _.addEventListener(Elm[k], 'paste', function () {
                    if (this instanceof HTMLInputElement)
                        this.val(this.val().replace(/[^A-Za-z\s]+/g, ""));
                    else
                        this.text(this.text().replace(/[^A-Za-z\s]+/g, ""));
                    this.cursorFin();
                });
            }
        });
        return this;
    });

    _defineProperty(this, "parent", function () {
        return _((this.Obj[0].parentElement || this.Obj[0].parentNode));
    });

    _defineProperty(this, "parents", function (q) {
        if (Element.prototype.closest)
            return _(this.Obj[0].closest(q));
        else {
            var el = this.Obj[0];
            do {
                if (el.matches(q)) return _(el);
                el = el.parentElement || el.parentNode;
            } while (el !== null && el.nodeType === 1);
            return null;
        }
    });

    _defineProperty(this, "prop", function (a, v) {
        if (v == undefined) {
            return this.Obj[0][a];
        } else {
            this.Obj[0][a] = v;
        }
    });

    _defineProperty(this, "ready", function (q) {
        if (document.readyState === 'complete') {
            setTimeout(q, 10);
        } else {
            _.onDocReady.push(q);
        }
    });

    _defineProperty(this, "remove", function () {
        this.each(function (idx, ob) {
            ob.parentNode.removeChild(ob);
        });
        return this;
    });

    _defineProperty(this, "removeAttr", function (a) {
        var Elm = this.Obj;
        Object.keys(this.Obj).forEach(function (k) {
            if (!isNaN(k)) Elm[k].removeAttribute(a);
        });
        return this;
    });

    _defineProperty(this, "removeClass", function (q) {
        var Elm = this.Obj;
        Object.keys(this.Obj).forEach(function (k) {
            if (!isNaN(k)) {
                const classList = q.split(" ");
                classList.forEach(cls => {
                    Elm[k].classList.remove(cls);
                });
            }
        });
        return this;
    });

    _defineProperty(this, "_scroll", function (top) {
        var Elm = this.Obj;
        Elm.each((idx, val) => {
            val.scroll({ top: (top ? 0 : val.scrollHeight), behavior: 'smooth' });
        });
        return this;
    });

    _defineProperty(this, "selectAll", function () {
        var Elm = this;
        Object.keys(this.Obj).forEach(function (k) {
            if (!isNaN(k)) {
                window.setTimeout(function () {
                    var sel, range;
                    if (window.getSelection && document.createRange) {
                        range = document.createRange();
                        range.selectNodeContents(Elm.Obj[0]);
                        sel = window.getSelection();
                        sel.removeAllRanges();
                        sel.addRange(range);
                    } else if (document.body.createTextRange) {
                        range = document.body.createTextRange();
                        range.moveToElementText(Elm.Obj[0]);
                        range.select();
                    }
                }, 1);
            }
        });
        return this;
    });

    _defineProperty(this, "seltext", function (q) {
        if (q == undefined) {
            if (this.Obj[0] instanceof HTMLSelectElement)
                return this.Obj[0].options[this.Obj[0].selectedIndex].text;
        } else {
            var Elm = this.Obj;
            Object.keys(this.Obj).forEach(function (k) {
                if (!isNaN(k)) {
                    if (Elm[k] instanceof HTMLSelectElement)
                        Elm[k].options[Elm[k].selectedIndex].text;
                }
            });
            return this;
        }
    });

    _defineProperty(this, "show", function (q) {
        var Elm = this;
        Object.keys(this.Obj).forEach(function (k) {
            if (!isNaN(k)) {
                var lad = Elm[k].attr('lad');
                if ((lad || lad == 'false') && lad != 'none') {
                    if (lad == 'false')
                        Elm[k].style.display = '';
                    else
                        Elm[k].style.display = lad;
                } else {
                    if (Elm[k].style.display == 'none')
                        Elm[k].style.display = '';
                    else
                        Elm[k].style.display = 'inline-block';
                }
            }
        });
        return this;
    });

    _defineProperty(this, "sortable", function (q) {
        var Elm = this;
        Object.keys(this.Obj).forEach(function (k) {
            if (!isNaN(k)) {
                _.sortable(Elm[k], q);
            }
        });
        return this;
    });

    _defineProperty(this, "text", function (q) {
        if (q == undefined) {
            return this.Obj[0].innerText;
        } else {
            var Elm = this.Obj;
            Object.keys(this.Obj).forEach(function (k) {
                if (!isNaN(k)) Elm[k].innerText = q;
            });
            return this;
        }
    });

    _defineProperty(this, "type", function (q) {
        if (q == undefined) {
            return this.Obj[0].type;
        } else {
            var Elm = this.Obj;
            Object.keys(this.Obj).forEach(function (k) {
                if (!isNaN(k)) Elm[k].type = q;
            });
            return this;
        }
    });

    _defineProperty(this, "val", function (q) {
        if (q == undefined) {
            if (this.Obj[0] instanceof HTMLInputElement || this.Obj[0] instanceof HTMLSelectElement || this.Obj[0] instanceof HTMLOptionElement)
                return this.Obj[0].value;
            else {
                return this.Obj[0].innerText;
            }
        } else {
            var Elm = this.Obj;
            Object.keys(this.Obj).forEach(function (k) {
                if (!isNaN(k)) {
                    if (Elm[k] instanceof HTMLInputElement || Elm[k] instanceof HTMLSelectElement || Elm[k] instanceof HTMLOptionElement)
                        Elm[k].value = q;
                    else {
                        Elm[k].innerText = q;
                        if (_(Elm[k]).attr('contenteditable') && _(Elm[k]).attr('contenteditable') == 'true') {
                            var range = document.createRange();
                            var sel = window.getSelection();
                            range.selectNodeContents(Elm[k]);
                            range.collapse(false);
                            sel.removeAllRanges();
                            sel.addRange(range);
                            Elm[k].focus();
                            range.detach();
                            Elm[k].scrollTop = Elm[k].scrollHeight;
                        }
                    }
                }
            });
            return this;
        }
    });
};

var _ = function (q) {
    var Obj = new _LexxPrivObj;
    if (_typeof(q) === 'function') { //Document Ready
        if (document.readyState === 'complete') {
            setTimeout(q, 10);
        } else {
            _.onDocReady.push(q);
        }
    } else if (_typeof(q) === 'string') {
        q = q.replaceAll(':selected', ':checked');
        var fndOb = _.querySelectorAll(document.querySelectorAll(q));
        return fndOb;
    } else if (q instanceof Element || q instanceof HTMLDocument || q === window) { //***** p */
        var fndOb = _.querySelectorAll([q]);
        return fndOb;
    } else if (_typeof(q) === 'object') {
        if (q && q._LexxPrivObj) {
            return q;
        } else if (q && q[0]) {
            if (q[0] instanceof Element || q[0] instanceof HTMLDocument) {
                var fndOb = _.querySelectorAll([q[0]]);
                return fndOb;
            }
        }
    } else {
        return _typeof(q);
    }
    return null;
};

//Objeto para opciones de array
_.array = function (a) {
    this.len = Object.keys(a).length;
    return this;
};

/**
 * Autocompletado de correos
 * @param {object} q Indicamos el objeto donse se escribe el correo
 */

_.autocompleteMail = function (q) {
    //Revisamos si no existe la variable global del autocomplet de emails, si no existe la creamos vacia
    if (!window.LexxAutocompleteMail)
        window.LexxAutocompleteMail = [];
    //Iniciamos el objeto
    let qOb = _(q);
    //Revisamos si ya está marcado como iniciado con el atributo data-autocomplete="true"
    if (!qOb.attr('data-autocomplete')) {
        qOb.attr('data-autocomplete', 'true');
        qOb.parent().addClass('App_Global_Bg_Autocomplete relative');
        //Agregamos el autocomplete
        _.autocomplete(qOb, 'LexxAutocompleteMail', { chars: 1 });
        //Iniciamos el evento de tecla pulsada
        _(q).on('input', (e) => {
            //Los correos que vamos a mostrar
            let Correos = [
                'gmail.com',
                'hotmail.com',
                'live.com',
                'outlook.com',
                'yahoo.es',
                'yahoo.com',
                'yahoo.com.mx'
            ];
            //Obtenemos el texto que el cliente ha ingresado
            let txt = _(e.target).val();
            var emlSpl = [];
            if (txt.indexOf('@') > 3) {
                emlSpl = txt.split('@');
            } else {
                emlSpl = [txt, ''];
            }
            window.LexxAutocompleteMail = [];
            _.each(Correos, (idx, vl) => {
                if (vl.startsWith(emlSpl[1])) {
                    window.LexxAutocompleteMail.push(emlSpl[0] + "@" + vl);
                }
            });
        });
    }
};

//onKeyPress="Global_checkMail(this);" lista="Poliza_Exequiales_C_AC"
function Global_checkMail(e) {
    var htmlReg = "";
    var crrT = $(e).html();
    var emlSpl = [];
    if (crrT.indexOf('@') > 3) {
        emlSpl = crrT.split('@');
    } else {
        emlSpl = [crrT, ''];
    }
    $.each(Global_Correos, function (idx, vl) {
        if (vl.startsWith(emlSpl[1])) {
            htmlReg += '<li onClick="Global_usarEste(this);">' + emlSpl[0] + "@" + vl + '</li>';
        }
    });
    $('#' + $(e).attr('lista')).html(htmlReg);

    if (crrT == '') {
        $('#' + $(e).attr('lista')).hide();
    } else {
        $('#' + $(e).attr('lista')).show();
    }
}

///////////////////

_.querySelectorAll = function (o) {
    if (Object.keys(o).length == 0)
        return null;
    //agregamos todas las propiedades y funciones al array de elementos
    Object.keys(o).forEach(function (key) {
        if (!isNaN(key)) {
            var Obj = new _LexxPrivObj;
            Obj.Obj = [o[key]];
            Object.keys(Obj).forEach(function (nkey) {
                if (_typeof(o[key][nkey]) === "undefined" || nkey == 'find') {
                    o[key][nkey] = Obj[nkey];
                }
            });
        }
    });
    var Obj = new _LexxPrivObj;
    Obj.Obj = o;
    //agregamos todas las propiedades y funciones al objeto
    Object.keys(Obj).forEach(function (key) {
        if (_typeof(o[key]) === "undefined" || key == 'find') {
            o[key] = Obj[key];
        }
    });
    return o;
};
_.onDocReady = [];
document.addEventListener("DOMContentLoaded", function () {
    setTimeout(function () {
        Object.keys(_.onDocReady).forEach(function (key) {
            _.onDocReady[key]();
        });
    }, 1000);
});

////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
/**
 * Múltiples eventos
 * @param {Element} e Elemento del DOM
 * @param {string} events Eventos separados por espacio
 * @param {Function} f Función a ejecutar
 * @param {object} [o] Opciones del listener
 */
_.addEventListener = function (e, events, f, o) {
    var ev = events.split(' ');
    ev.forEach(function (eventName) {
        // Evitar agregar listeners para eventos deprecados
        if (eventName !== 'DOMCharacterDataModified') {
            e.addEventListener(eventName, f, o || { passive: true });
        }
    });
};

_.base64 = [];
_.base64._keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
/**
 * Convertimos a base64
*@param {string} s String a convertir
*/
_.base64.encode = function (e) {
    var t = "";
    var n, r, i, s, o, u, a;
    var f = 0;
    e = _.base64._utf8_encode(e);
    while (f < e.length) {
        n = e.charCodeAt(f++);
        r = e.charCodeAt(f++);
        i = e.charCodeAt(f++);
        s = n >> 2;
        o = (n & 3) << 4 | r >> 4;
        u = (r & 15) << 2 | i >> 6;
        a = i & 63;
        if (isNaN(r)) {
            u = a = 64
        } else if (isNaN(i)) {
            a = 64
        }
        t = t + _.base64._keyStr.charAt(s) + _.base64._keyStr.charAt(o) + _.base64._keyStr.charAt(u) + _.base64._keyStr.charAt(a)
    }
    return t
};

////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
/**
 * Decodificamos base64 a String
*@param {string} s String Base64
*/
_.base64.decode = function (e) {
    var t = "";
    var n, r, i;
    var s, o, u, a;
    var f = 0;
    e = e.replace(/[^A-Za-z0-9\+\/\=]/g, "");
    while (f < e.length) {
        s = _.base64._keyStr.indexOf(e.charAt(f++));
        o = _.base64._keyStr.indexOf(e.charAt(f++));
        u = _.base64._keyStr.indexOf(e.charAt(f++));
        a = _.base64._keyStr.indexOf(e.charAt(f++));
        n = s << 2 | o >> 4;
        r = (o & 15) << 4 | u >> 2;
        i = (u & 3) << 6 | a;
        t = t + String.fromCharCode(n);
        if (u != 64) {
            t = t + String.fromCharCode(r)
        }
        if (a != 64) {
            t = t + String.fromCharCode(i)
        }
    }
    t = _.base64._utf8_decode(t);
    return t
};
_.base64._utf8_encode = function (e) {
    e = e.replace(/\r\n/g, "\n");
    var t = "";
    for (var n = 0; n < e.length; n++) {
        var r = e.charCodeAt(n);
        if (r < 128) {
            t += String.fromCharCode(r)
        } else if (r > 127 && r < 2048) {
            t += String.fromCharCode(r >> 6 | 192);
            t += String.fromCharCode(r & 63 | 128)
        } else {
            t += String.fromCharCode(r >> 12 | 224);
            t += String.fromCharCode(r >> 6 & 63 | 128);
            t += String.fromCharCode(r & 63 | 128)
        }
    }
    return t
};
_.base64._utf8_decode = function (e) {
    var t = "";
    var n = 0;
    var r = 0;
    var c2 = 0;
    while (n < e.length) {
        r = e.charCodeAt(n);
        if (r < 128) {
            t += String.fromCharCode(r);
            n++
        } else if (r > 191 && r < 224) {
            c2 = e.charCodeAt(n + 1);
            t += String.fromCharCode((r & 31) << 6 | c2 & 63);
            n += 2
        } else {
            c2 = e.charCodeAt(n + 1);
            c3 = e.charCodeAt(n + 2);
            t += String.fromCharCode((r & 15) << 12 | (c2 & 63) << 6 | c3 & 63);
            n += 3
        }
    }
    return t
};

////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
/**
 * Decodificamos base64 a String
*@param {string} s String Base64
*/
_.base64_decode = function (s) {
    return _.base64.decode(s);
};

////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
/**
 * Convertimos a base64
*@param {string} s String a convertir
*/
_.base64_encode = function (s) {
    return _.base64.encode(s);
};

////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
//función Between (float)
//n = número a comparar
//min = mínimo
//max = máximo
_.Between = function (n, min, max) {
    var nN = parseFloat(n);
    var nMin = parseFloat(min);
    var nMax = parseFloat(max);
    if (nN >= nMin && nN <= nMax)
        return true;
    else
        return false;
};

////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
/**
 * blockconsole
*/
_.blockConsole = function () {
    var iel = new Image;
    var _ldto = false;
    iel.__defineGetter__("id", function () {
        _ldto = true;
    });
    setInterval(function () {
        _ldto = false;
        //var f = navigator.userAgent.search("Firefox");
        //if (f > -1) {
        //if ((window.outerHeight - window.innerHeight) > 200 || (window.outerWidth - window.innerWidth) > 200)
        //    _ldto = true;
        var tmBg = (new Date).getTime();
        _.debugger();
        var tmEnd = (new Date).getTime();
        if ((tmEnd - tmBg) > 1000)
            _ldto = true;
        //} else {
        //    console.log(iel);
        //}

        if (_ldto) {
            document.documentElement.innerHTML = '';
            window.location = 'about:blank';
        }
        if (console.clear)
            console.clear();
    }, 1000);

    document.body.addEventListener('keydown', function (e) {
        var keyCode = e.keyCode || e.which || e.key;
        if (keyCode == 123)
            e.preventDefault();
    });
};

////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
//Opciones
//defecto: undir
//arrab
//izqder
/**
 * buzz
 * @param e objeto a mover
 * @param o Opciones
 * @param f función a ejecutar al terminar
 * @param c mueve el elemento actual
*/
_.buzz = function (e, o, f, c) {
    if (window && window.event && window.event.target)
        if (e !== window.event.target) return;
    var opc = { tipo: "undir", tiempo: 300 };
    if (o) {
        if (o.tipo) opc.tipo = o.tipo;
        if (o.tiempo) opc.tiempo = o.tiempo;
    }
    var aOb = [_(e).Obj[0]];
    if (!c)
        aOb = _(e).Obj[0].childNodes;
    if (opc.tipo == 'undir') {
        _.each(aOb, function (i, v) {
            if (v instanceof HTMLElement) {
                _(v).css('transition', 'all ' + ((opc.tiempo / 2) / 1000) + 's ease-in-out');
                _(v).css('transform', 'scale(0.95)');
                setTimeout(function () {
                    _(v).css('transform', 'scale(1)');
                    setTimeout(function () {
                        _(v).css('transition', '');
                        _(v).css('transform', '');
                        if (f)
                            f();
                    }, opc.tiempo / 2);
                }, opc.tiempo / 2);
            }
        }, true);
    } else if (opc.tipo == 'arrab') {
        _.each(aOb, function (i, v) {
            if (v instanceof HTMLElement) {
                _(v).css('transition', 'all ' + ((opc.tiempo / 2) / 1000) + 's ease-in-out');
                _(v).css('margin-top', '-20px');
                setTimeout(function () {
                    _(v).css('margin-top', '20px');
                    setTimeout(function () {
                        _(v).css('transition', '');
                        _(v).css('transform', '');
                        _(v).css('transform', 'scale(1)');
                        setTimeout(function () {
                            _(v).css('transition', '');
                            _(v).css('margin-top', '');
                            if (f)
                                f();
                        }, opc.tiempo / 2 / 2);
                    }, opc.tiempo / 2);
                }, opc.tiempo / 2 / 2);
            }
        }, true);
    } else if (opc.tipo == 'izqder') {
        _.each(aOb, function (i, v) {
            if (v instanceof HTMLElement) {
                _(v).css('transition', 'all ' + ((opc.tiempo / 2) / 1000) + 's ease-in-out');
                _(v).css('margin-left', '-20px');
                setTimeout(function () {
                    _(v).css('margin-left', '20px');
                    setTimeout(function () {
                        _(v).css('transition', '');
                        _(v).css('transform', '');
                        _(v).css('transform', 'scale(1)');
                        setTimeout(function () {
                            _(v).css('transition', '');
                            _(v).css('margin-left', '');
                            if (f)
                                f();
                        }, opc.tiempo / 2 / 2);
                    }, opc.tiempo / 2);
                }, opc.tiempo / 2 / 2);
            }
        }, true);
    }
};

////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
//función compartir
_.compartir = [];
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
//función whatsapp
_.compartir.whatsapp = function (Mensje, Num) {
    if (Num == undefined) Num = "";
    var encodeMes = encodeURI(Mensje);
    while (encodeMes.indexOf('&') > 0) {
        encodeMes = encodeMes.replace("&", "%26");
    }

    while (encodeMes.indexOf('/') > 0) {
        encodeMes = encodeMes.replace("/", "%2F");
    }

    while (encodeMes.indexOf(':') > 0) {
        encodeMes = encodeMes.replace(":", "%3A");
    }

    while (encodeMes.indexOf('?') > 0) {
        encodeMes = encodeMes.replace("?", "%3F");
    }

    while (encodeMes.indexOf('=') > 0) {
        encodeMes = encodeMes.replace("=", "%3D");
    }
    window.open('https://api.whatsapp.com/send?' + (Num != '' ? 'phone=' + Num + '&' : '') + 'text=' + encodeMes + '&source=&data=&app_absent=', '_blank');
};





// Función para crear un elemento HTML con clases y contenido opcional
_.crearElemento = function (tipo, clases, contenido) {
    let elemento = document.createElement(tipo);
    clases.forEach(clase => {
        elemento.classList.add(clase);
    });
    if (contenido) {
        elemento.innerHTML = contenido;
    }
    return elemento;
};


////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
//función confirm
/*
Ejemplo:

var ALt = {
    Title: "Prueba de Título",
    Type: 'Alert',//Alert, Success, Error
    Message: [
        ["Subtítulo"],
        ["Data 1","Resultado 1"],
        ["Data 2","Resultado 2"],
        ["Data 3","Resultado 3"],
    ],
    Buttons: {
        Ok:{
            Name: "Accept",
            func: ()=>{},
        },
        Cancel:{
            Name: "Cancel",
            func: ()=>{return true;},
        },
    }
};
_.confirm(ALt);

*/

_.confirm = function (q) {
    if (typeof q !== "string") {
        let Options = q;
        if (!Options.Title)
            Options.Title = "";

        if (!Options.Buttons)
            Options.Buttons = {};

        if (!Options.Buttons.Ok)
            Options.Buttons.Ok = {
                Name: "",
                func: () => { },
            };

        if (!Options.Buttons.Cancel)
            Options.Buttons.Cancel = {
                Name: "",
                func: () => { },
            };

        if (!Options.Message)
            Options.Message = "";

        if (!Options.Type)
            Options.Type = "";

        // Crear la ventana de confirmación
        let ventana = _.crearElemento('div', ['lexx_window_confirm']);
        let overlay = _.crearElemento('div', ['lexx_window_confirm_overlay']);
        overlay.onclick = function () { _.buzz(this); };
        let mCont = [];
        mCont.push('lexx_window_confirm_container');
        if (Options.Type == 'Alert')
            mCont.push('warning');
        else if (Options.Type == 'Success')
            mCont.push('success');
        else if (Options.Type == 'Error')
            mCont.push('danger');

        let contenedor = _.crearElemento('div', mCont);

        // Crear el encabezado
        let encabezado = _.crearElemento('div', ['lexx_window_confirm_header']);
        let titulo = _.crearElemento('div', ['lexx_window_confirm_title'], '<b>' + Options.Title + '</b>');
        encabezado.appendChild(titulo);

        // Crear el diálogo de confirmación
        let dialogo = _.crearElemento('div', ['lexx_window_confirm_dialog']);
        let info = _.crearElemento('div', ['lexx_window_confirm_info']);
        info.appendChild(_.crearElemento('div', ['lexx_window_confirm_item', 'lexx_window_confirm_icono', 'flex', 'flex_center', 'justify_center', 'w_100'], '<span class="lexx_window_confirm_icono_start"><samp class="lexx_confirm_icon_error hide"><i class="lexx lexx_times"></i></samp><samp class="lexx_confirm_icon_alert hide"><i class="lexx lexx_alert_t"></i></samp><samp class="lexx_confirm_icon_success hide"><i class="lexx lexx_check_ok"></i></samp></span>'));
        if (typeof Options.Message === "string") {
            info.appendChild(_.crearElemento('div', ['lexx_window_confirm_item'], '<p class="lexx_window_confirm_subtitle">' + Options.Message + '</p>'));
        } else {
            _.each(Options.Message, (idx, val) => {
                if (val.length == 2)
                    info.appendChild(_.crearElemento('div', ['lexx_window_confirm_item'], '<div class="lexx_window_confirm_description"><b>' + val[0] + ': </b> <span>' + val[1] + '</span></div>'));
                else
                    info.appendChild(_.crearElemento('div', ['lexx_window_confirm_item'], '<p class="lexx_window_confirm_subtitle">' + val[0] + '</p>'));
            });
        }

        dialogo.appendChild(info);

        // Crear el pie de página con botones
        let pie = _.crearElemento('div', ['lexx_window_confirm_footer']);

        // Ensamblar toda la estructura
        contenedor.appendChild(encabezado);
        contenedor.appendChild(dialogo);
        contenedor.appendChild(pie);
        overlay.appendChild(contenedor);
        ventana.appendChild(overlay);

        // Añadir la ventana al cuerpo del documento
        document.body.appendChild(ventana);

        if (Options.Buttons.Ok && (Options.Buttons.Ok.Name ?? '') != '') {

            let btnAceptarDiv = _.crearElemento('div', ['lexx_window_confirm_btn_ok'], '');
            let btnAceptar = _.crearElemento('button', [], Options.Buttons.Ok.Name);
            btnAceptar.type = "button";
            btnAceptarDiv.appendChild(btnAceptar);

            btnAceptar.onclick = function () {
                let Ret = Options.Buttons.Ok.func();
                if (Ret)
                    return;
                _(ventana).remove();
            };
            pie.appendChild(btnAceptarDiv);
            setTimeout(function () {
                btnAceptar.focus();
            }, 100);
        }
        if (Options.Buttons.Cancel && (Options.Buttons.Cancel.Name ?? '') != '') {

            let btnCancelarDiv = _.crearElemento('div', ['lexx_window_confirm_btn_cancel'], '');
            let btnCancelar = _.crearElemento('button', [], Options.Buttons.Cancel.Name);
            btnCancelar.type = "button";
            btnCancelarDiv.appendChild(btnCancelar);

            pie.appendChild(btnCancelarDiv);

            btnCancelar.onclick = function () {
                let Ret = Options.Buttons.Cancel.func();
                if (Ret)
                    return;
                _(ventana).remove();
            };
        }
    } else {
        return confirm(q);
    }
};

////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
//función copy
//str = Texto a copiar al portapapeles
_.copy = function (str) {
    var t = document.createElement("textarea");
    t.value = str;

    t.style.top = "0";
    t.style.left = "0";
    t.style.position = "fixed";

    document.body.appendChild(t);
    t.focus();
    t.select();

    try {
        var successful = document.execCommand('copy');
        if (successful) {
            document.body.removeChild(t);
            return true;
        } else {
            document.body.removeChild(t);
            return false;
        }
    } catch (err) {
        document.body.removeChild(t);
        return false;
    }
};

////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
//función tdate retorna la fecha en string
//f = Formato de fecha (Y/m/d H:i:s)
//u = fecha en unix
_.date = function (f, u) {
    if (u == undefined) u = Math.round((new Date()).getTime() / 1000);
    var dt = new Date(u * 1000);
    var fString = "";
    for (var _i = 0; _i < f.length; _i++) {
        if (f.substring(_i, _i + 1) == "Y") {
            fString += dt.getFullYear();
        } else if (f.substring(_i, _i + 1) == "m") {
            fString += dt.getMonth() < 9 ? "0" + (dt.getMonth() + 1) : (dt.getMonth() + 1);
        } else if (f.substring(_i, _i + 1) == "d") {
            fString += dt.getDate() < 10 ? "0" + dt.getDate() : dt.getDate();
        } else if (f.substring(_i, _i + 1) == "H") {
            fString += dt.getHours() < 10 ? "0" + dt.getHours() : dt.getHours();
        } else if (f.substring(_i, _i + 1) == "i") {
            fString += dt.getMinutes() < 10 ? "0" + dt.getMinutes() : dt.getMinutes();
        } else if (f.substring(_i, _i + 1) == "s") {
            fString += dt.getSeconds() < 10 ? "0" + dt.getSeconds() : dt.getSeconds();
        } else if (f.substring(_i, _i + 1) == "U") {
            fString += u;
        } else {
            if (f.substring(_i, _i + 1) == "\\")
                _i++;
            fString += f.substring(_i, _i + 1);
        }
    }
    return fString;
};

////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
/**
 * Debugger
*/
_.debugger = () => {
    debugger;
};

/**
 * Formatea un número utilizando un separador de miles de coma y un separador decimal de punto.
 *
 * @param {number} number El número a formatear.
 * @returns {string} El número formateado como una cadena.
 */
_.formatNumber = (number, decimals = 2) => {
    let Nro = Number(number).toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
        useGrouping: true
    });
    if (Nro == 'NaN') Nro = 0;
    return Nro;
};

////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
/**
 * Obtiene el Host actual
*/
_.getHost = () => location.hostname;

////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
/**
 * Obtiene la Key de la sesión
*/
_.getKey = () => {
    var k = localStorage.getItem("X-Key");
    return k == 'undefined' ? false : k;
};

////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
/**
 * Obtiene la Key de la sesión
*@param {object} q Objeto array
*@param {object} f Función retorno
*@param {boolean} oin Si es verdadero, solo devuelve los index numéricos
*/
_.each = function (q, f, oin) {
    for (var idx in q) {
        if (idx != 'length') {
            if (oin) {
                if (isNaN(idx))
                    continue;
            }
            var fRt = {
                func: f
            };
            for (var vidx in q[idx]) {
                try {
                    fRt[vidx] = q[idx][vidx];
                } catch (e) { }
            }
            var rt = fRt.func(idx, q[idx]);
            if (rt === false) break;
        }
    }
};

////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
/**
 * Obtenemos un ID de 32 caracteres
*@param {string} salto string a revisar
*/
_.getID = (salto) => _.MD5(_.date("U") + "." + (new Date()).getMilliseconds() + ":" + (salto ? salto : ""));

////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////

/**
 * Obtiene el Hash # de la URI
 * @returns {string} Hash obtenido en la uri
 */
_.hash = function () {
    return _.hash.current;
};

/**
 * 
 * @param {*} f Función a la que se notificará el hash cuando se invoque
 */
_.hash.set = function (f) {
    if (typeof f === 'function') {
        _.hash.functions.push(f);
    } else {
        console.error('El argumento proporcionado no es una función de _.hash.set');
    }
};

_.hash.functions = [];
_.hash.current = "";
//Creamos la función para obtener el hash en tiempo real y para informar de él si se indica en funciones
window.onhashchange = function (evt) {
    let Hash = evt.newURL.split("#")[1];
    _.hash.current = Hash;
    _.each(_.hash.functions, (idx, val) => {
        val(Hash);
    });
};

////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
/**
 * Revisamos si un string está en el array
*@param {string} needle string a revisar
*@param {array} haystack array donde buscar
*/
_.in_array = function (needle, haystack) {
    var Std = false;
    _.each(haystack, function (idx, val) {
        if (val == needle) {
            Std = true;
            return false;
        }
    });
    return Std;
};

/**
* Añade un evento de entrada a un elemento input para formatearlo como un número con separadores de miles mientras se escribe.
*
* @param {object} inputElement El elemento input al que añadir el evento.
*/
_.inputFormatting = function (inputElement) {
    // Detecta el separador decimal del usuario.
    const decimalSeparator = (1.1).toLocaleString().substring(1, 2);

    _(inputElement).on('keyup', (e) => {
        // Extrae el valor del input.
        let value = _(e.target).val();
        let Ngt = value.substr(0, 1) == '-' ? true : false;
        if (e.code === 'NumpadDecimal' && decimalSeparator != '.') {
            value = value.substr(0, value.length - 1) + decimalSeparator;
        }

        // Crea una nueva expresión regular para eliminar cualquier carácter que no sea un número o el separador decimal.
        let regex = new RegExp(`[^0-9\\${decimalSeparator}]`, 'g');
        value = value.replace(regex, '');

        // Separa la parte entera y decimal.
        let parts = value.split(decimalSeparator);

        // Formatea la parte entera con separadores de miles.
        parts[0] = _.formatNumber(parts[0], 0);

        // Une las partes y actualiza el valor del input.
        _(e.target).val((Ngt ? '-' : '') + parts.join(decimalSeparator));
    });
};

////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
/**
 * Revisamos si es Internet Explorer
*/
_.isIE = function () {
    var ua = window.navigator.userAgent;
    var msie = ua.indexOf("MSIE ") > -1;
    var msie_trident = ua.indexOf('Trident/') > -1;
    if (msie || msie_trident)
        return true;
    else
        return false;
};


////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
/**
 * Revisamos si un string es mail
*@param {string} e Correo Electrónico a revisar si es válido
*/
_.isMail = function (e) {
    if (/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(e)) {
        return (true);
    }
    return (false);
};

_.isWindowActive = true;
window.addEventListener('focus', () => { _.isWindowActive = true; });
window.addEventListener('blur', () => { _.isWindowActive = false; });


////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
/**
 * convertimos un string en MD5
*@param {string} d string a convertir
*/
_.MD5 = (function () {
    var MD5 = function (d) {
        return M(V(Y(X(d), 8 * d.length)));
    };
    function M(d) {
        for (var _, m = '0123456789abcdef', f = '', r = 0; r < d.length; r++) {
            _ = d.charCodeAt(r);
            f += m.charAt(_ >>> 4 & 15) + m.charAt(15 & _);
        }
        return f;
    }
    function X(d) {
        for (var _ = Array(d.length >> 2), m = 0; m < _.length; m++) {
            _[m] = 0;
        }
        for (m = 0; m < 8 * d.length; m += 8) {
            _[m >> 5] |= (255 & d.charCodeAt(m / 8)) << m % 32;
        }
        return _;
    }
    function V(d) {
        for (var _ = '', m = 0; m < 32 * d.length; m += 8) _ += String.fromCharCode(d[m >> 5] >>> m % 32 & 255);
        return _;
    }
    function Y(d, _) {
        d[_ >> 5] |= 128 << _ % 32;
        d[14 + (_ + 64 >>> 9 << 4)] = _;
        for (var m = 1732584193, f = -271733879, r = -1732584194, i = 271733878, n = 0; n < d.length; n += 16) {
            var h = m;
            var t = f;
            var g = r;
            var e = i;
            f = md5ii(f = md5ii(f = md5ii(f = md5ii(f = md5hh(f = md5hh(f = md5hh(f = md5hh(f = md5gg(f = md5gg(f = md5gg(f = md5gg(f = md5ff(f = md5ff(f = md5ff(f = md5ff(f, r = md5ff(r, i = md5ff(i, m = md5ff(m, f, r, i, d[n + 0], 7, -680876936), f, r, d[n + 1], 12, -389564586), m, f, d[n + 2], 17, 606105819), i, m, d[n + 3], 22, -1044525330), r = md5ff(r, i = md5ff(i, m = md5ff(m, f, r, i, d[n + 4], 7, -176418897), f, r, d[n + 5], 12, 1200080426), m, f, d[n + 6], 17, -1473231341), i, m, d[n + 7], 22, -45705983), r = md5ff(r, i = md5ff(i, m = md5ff(m, f, r, i, d[n + 8], 7, 1770035416), f, r, d[n + 9], 12, -1958414417), m, f, d[n + 10], 17, -42063), i, m, d[n + 11], 22, -1990404162), r = md5ff(r, i = md5ff(i, m = md5ff(m, f, r, i, d[n + 12], 7, 1804603682), f, r, d[n + 13], 12, -40341101), m, f, d[n + 14], 17, -1502002290), i, m, d[n + 15], 22, 1236535329), r = md5gg(r, i = md5gg(i, m = md5gg(m, f, r, i, d[n + 1], 5, -165796510), f, r, d[n + 6], 9, -1069501632), m, f, d[n + 11], 14, 643717713), i, m, d[n + 0], 20, -373897302), r = md5gg(r, i = md5gg(i, m = md5gg(m, f, r, i, d[n + 5], 5, -701558691), f, r, d[n + 10], 9, 38016083), m, f, d[n + 15], 14, -660478335), i, m, d[n + 4], 20, -405537848), r = md5gg(r, i = md5gg(i, m = md5gg(m, f, r, i, d[n + 9], 5, 568446438), f, r, d[n + 14], 9, -1019803690), m, f, d[n + 3], 14, -187363961), i, m, d[n + 8], 20, 1163531501), r = md5gg(r, i = md5gg(i, m = md5gg(m, f, r, i, d[n + 13], 5, -1444681467), f, r, d[n + 2], 9, -51403784), m, f, d[n + 7], 14, 1735328473), i, m, d[n + 12], 20, -1926607734), r = md5hh(r, i = md5hh(i, m = md5hh(m, f, r, i, d[n + 5], 4, -378558), f, r, d[n + 8], 11, -2022574463), m, f, d[n + 11], 16, 1839030562), i, m, d[n + 14], 23, -35309556), r = md5hh(r, i = md5hh(i, m = md5hh(m, f, r, i, d[n + 1], 4, -1530992060), f, r, d[n + 4], 11, 1272893353), m, f, d[n + 7], 16, -155497632), i, m, d[n + 10], 23, -1094730640), r = md5hh(r, i = md5hh(i, m = md5hh(m, f, r, i, d[n + 13], 4, 681279174), f, r, d[n + 0], 11, -358537222), m, f, d[n + 3], 16, -722521979), i, m, d[n + 6], 23, 76029189), r = md5hh(r, i = md5hh(i, m = md5hh(m, f, r, i, d[n + 9], 4, -640364487), f, r, d[n + 12], 11, -421815835), m, f, d[n + 15], 16, 530742520), i, m, d[n + 2], 23, -995338651), r = md5ii(r, i = md5ii(i, m = md5ii(m, f, r, i, d[n + 0], 6, -198630844), f, r, d[n + 7], 10, 1126891415), m, f, d[n + 14], 15, -1416354905), i, m, d[n + 5], 21, -57434055), r = md5ii(r, i = md5ii(i, m = md5ii(m, f, r, i, d[n + 12], 6, 1700485571), f, r, d[n + 3], 10, -1894986606), m, f, d[n + 10], 15, -1051523), i, m, d[n + 1], 21, -2054922799), r = md5ii(r, i = md5ii(i, m = md5ii(m, f, r, i, d[n + 8], 6, 1873313359), f, r, d[n + 15], 10, -30611744), m, f, d[n + 6], 15, -1560198380), i, m, d[n + 13], 21, 1309151649), r = md5ii(r, i = md5ii(i, m = md5ii(m, f, r, i, d[n + 4], 6, -145523070), f, r, d[n + 11], 10, -1120210379), m, f, d[n + 2], 15, 718787259), i, m, d[n + 9], 21, -343485551);
            m = safeadd(m, h);
            f = safeadd(f, t);
            r = safeadd(r, g);
            i = safeadd(i, e);
        }
        return [m, f, r, i];
    }
    function md5cmn(d, _, m, f, r, i) {
        return safeadd(bitrol(safeadd(safeadd(_, d), safeadd(f, i)), r), m);
    }
    function md5ff(d, _, m, f, r, i, n) {
        return md5cmn(_ & m | ~_ & f, d, _, r, i, n);
    }
    function md5gg(d, _, m, f, r, i, n) {
        return md5cmn(_ & f | m & ~f, d, _, r, i, n);
    }
    function md5hh(d, _, m, f, r, i, n) {
        return md5cmn(_ ^ m ^ f, d, _, r, i, n);
    }
    function md5ii(d, _, m, f, r, i, n) {
        return md5cmn(m ^ (_ | ~f), d, _, r, i, n);
    }
    function safeadd(d, _) {
        var m = (65535 & d) + (65535 & _);
        return (d >> 16) + (_ >> 16) + (m >> 16) << 16 | 65535 & m;
    }
    function bitrol(d, _) {
        return d << _ | d >>> 32 - _;
    }
    function MD5Unicode(buffer) {
        if (!(buffer instanceof Uint8Array)) {
            buffer = new TextEncoder().encode(typeof buffer === 'string' ? buffer : JSON.stringify(buffer));
        }
        var binary = [];
        var bytes = new Uint8Array(buffer);
        for (var i = 0, il = bytes.byteLength; i < il; i++) {
            binary.push(String.fromCharCode(bytes[i]));
        }
        return MD5(binary.join(''));
    }

    return MD5Unicode;
})();
_.md5 = _.MD5;

_.microtime = function () {
    return (new Date()).getTime();
};

//Se establece la variable de opciones
_.options = [];
_.options.key = "def";
/**
 * Obtiene Opciones de Web
 * @param {string} n nombre de la opción
*/
_.options.get = function (n) {
    var Opt = localStorage.getItem("options");
    if (!Opt) Opt = '{}';
    Opt = JSON.parse(Opt);
    if (!Opt[_.options.key]) Opt[_.options.key] = new Object;
    if (Opt[_.options.key][n] != undefined)
        return Opt[_.options.key][n];
    else
        null;
};
/**
 * Elimina Opciones de Web
 * @param {string} n nombre de la opción
*/
_.options.remove = function (n) {
    var oVar = new Object;
    var Opt = localStorage.getItem("options");
    if (!Opt) Opt = '{}';
    Opt = JSON.parse(Opt);
    if (!Opt[_.options.key]) Opt[_.options.key] = new Object;
    _.each(Opt[_.options.key], function (idx, val) {
        if (idx != n)
            oVar[idx] = val;
    });
    Opt[_.options.key] = oVar;
    localStorage.setItem("options", JSON.stringify(Opt));
};
/**
 * Guarda Opciones de Web
 * @param {string} n nombre de la opción
 * @param {string} v valor de la opción
*/
_.options.set = function (n, v) {
    var Opt = localStorage.getItem("options");
    if (!Opt) Opt = '{}';
    Opt = JSON.parse(Opt);
    if (!Opt[_.options.key]) Opt[_.options.key] = new Object;
    Opt[_.options.key][n] = v;
    localStorage.setItem("options", JSON.stringify(Opt));
};

/**
 * Llenar de x caracter a la derecha
 * @param {string} S String
 * @param {Number} len cantidad de caracteres
 * @param {string} c caracter a concatenar
*/
_.pad_left = function (S, len, c) {
    var s = s, c = c || '0';
    while (S.length < len) s = c + s;
    return s;
};

/**
 * Llenar de x caracter a la derecha
 * @param {string} S String
 * @param {Number} len cantidad de caracteres
 * @param {string} c caracter a concatenar
*/
_.pad_right = function (S, len, c) {
    var s = s, c = c || '0';
    while (S.length < len) s += c;
    return s;
};

/**
 * Llenar de x caracter a la derecha
 * @param {string} S String
 * @param {Number} len cantidad de caracteres
 * @param {string} c caracter a concatenar
*/
_.rand = function (min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
};

////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
_.recaptcha = [];
_.recaptcha.key = "";
/**
 * inicia Recaptcha
 * @param {string} key llave pública
*/
_.recaptcha.iniciar = function (key, hide) {
    _.recaptcha.key = key;
    //Revisar que ya no se haya agregado
    var RC = _('#reCaptchaGoogle');
    //Si no existe lo creamos
    if (RC == null || RC == undefined) {
        var RC = document.createElement("script");
        RC.id = "reCaptchaGoogle";
        RC.src = 'https://www.google.com/recaptcha/api.js?render=' + key;
        document.body.appendChild(RC);
        if (hide) {
            var ContRC = 0;
            var CheckRCP = function () {
                if (ContRC > 50) return;
                setTimeout(function () {
                    if (!window['grecaptcha']) {
                        CheckRCP();
                        ContRC += 1;
                        return;
                    }
                    grecaptcha.ready(function () {
                        _('.grecaptcha-badge').css('display', 'none');
                    });
                }, 200);
            };
            CheckRCP();
        }
    }
};

////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
/**
 * verifica el recaptcha
 * @param {object} success funcion exitosa
 * @param {object} fail funcion fallida
*/
_.recaptcha.verificar = function (success, fail) {
    var RC = _('.grecaptcha-badge');
    RC.css('display', 'block');
    var lzIdx = _.zIndex();
    var czIdx = Number(RC.css('z-index'));
    if (czIdx < lzIdx)
        RC.css('z-index', (lzIdx + 1));

    grecaptcha.ready(function () {
        grecaptcha.execute(_.recaptcha.key, {
            action: 'submit'
        }).then(function (token) {
            RC.css('z-index', '');
            success(token);
        }).catch(function (r) {
            RC.css('z-index', '');
            fail();
        });
    });
};

////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
/**
 * Elimina la Key de la sesión
*/
_.removeKey = function () {
    localStorage.removeItem("X-Key");
};

////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
/**
 * establece la Key de la sesión
 * @param {string} k Key
*/
_.setKey = function (k) {
    localStorage.setItem("X-Key", k);
};

////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
/**
 * convierte todo lo que contenga las clases Editable, EditablePass, EditableNumber, EditableNumberFormat, EditableTel, EditableEMail, EditableMultiline, EditableMultilineHtml en editable, 
 * @param {boolean} readonly Key
*/
_.setEditable = function (readonly) {
    var EDT = _('.Editable');
    if (EDT)
        _('.Editable').each(function (idx, val) {
            val.editable({
                type: "text",
                readonly: readonly ? true : false
            }).removeClass('Editable');
            val.attr('editablemode', 'Editable');
        });

    EDT = _('.EditablePass');
    if (EDT)
        EDT.each(function (idx, val) {
            val.editable({
                type: "password",
                readonly: readonly ? true : false
            }).removeClass('EditablePass');
            val.attr('editablemode', 'EditablePass');
        });

    EDT = _('.EditableNumber');
    if (EDT)
        EDT.each(function (idx, val) {
            val.editable({
                type: "tel",
                readonly: readonly ? true : false
            }).removeClass('EditableNumber').onlynumbers();
            val.attr('editablemode', 'EditableNumber');
        });

    EDT = _('.EditableNumberFormat');
    if (EDT)
        EDT.each(function (idx, val) {
            val.editable({
                type: "tel",
                readonly: readonly ? true : false,
                numberformat: true
            }).removeClass('EditableNumberFormat');
            val.attr('editablemode', 'EditableNumberFormat');
        });

    EDT = _('.EditableTel');
    if (EDT)
        EDT.each(function (idx, val) {
            val.editable({
                type: "tel",
                readonly: readonly ? true : false
            }).removeClass('EditableTel');
            val.attr('editablemode', 'EditableTel');
        });

    EDT = _('.EditableEMail');
    if (EDT)
        EDT.each(function (idx, val) {
            val.editable({
                type: "email",
                readonly: readonly ? true : false
            }).removeClass('EditableEMail');
            val.attr('editablemode', 'EditableEMail');
        });

    EDT = _('.EditableMultiline');
    if (EDT)
        EDT.each(function (idx, val) {
            val.editable({
                type: "text",
                readonly: readonly ? true : false,
                MultiLine: true
            }).removeClass('EditableMultiline');
            val.attr('editablemode', 'EditableMultiline');
        });

    EDT = _('.EditableMultilineHtml');
    if (EDT)
        EDT.each(function (idx, val) {
            val.editable({
                type: "text",
                readonly: readonly ? true : false,
                MultiLineHtml: true
            }).removeClass('EditableMultilineHtml');
            val.attr('editablemode', 'EditableMultilineHtml');
        });
};

//Ordenar Tabla, la tabla debe contener tbody
_.sortTable = function (table, col, reverse = false, number = false) {
    var tb = table.tBodies[0],
        tr = Array.prototype.slice.call(tb.rows, 0), i;
    reverse = -((+reverse) || -1);
    tr = tr.sort(function (a, b) {
        if (number) {
            var v1 = parseInt(a.cells[col].textContent.replaceAll(",", "").replaceAll("$ ", ""));
            var v2 = parseInt(b.cells[col].textContent.replaceAll(",", "").replaceAll("$ ", ""));
            return reverse * (v1 < v2 ? 1 : (v1 > v2 ? -1 : 0));
        } else
            return reverse * (a.cells[col].textContent.trim().localeCompare(b.cells[col].textContent.trim()));
    });
    for (i = 0; i < tr.length; ++i) tb.appendChild(tr[i]);
};

//Convertir svg a imagen
_.svg2img = function (c) {
    var EL = document.createElement('div');
    EL.innerHTML = c;
    var svg = EL.querySelector('svg');
    var xml = new XMLSerializer().serializeToString(svg);
    var svg64 = btoa(xml);
    var b64start = 'data:image/svg+xml;base64,';
    svg64 = svg64.replace('<svg', '<svg fill="currentColor"');
    var image64 = b64start + svg64;
    return image64;
};

////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
//función toDate retorna la fecha de string a unix
//d = String Fecha
//f = Formato de fecha (Y/m/d H:i:s)
_.toUnix = function (_d, f) {
    if (f == undefined)
        f = "YmdHis";
    var cD = _d;
    var Y = 0;
    var m = 0;
    var d = 0;
    var H = 0;
    var i = 0;
    var s = 0;
    for (var _i = 0; _i < f.length; _i++) {
        if (f.substring(_i, _i + 1) == "Y") {
            Y = cD.substring(0, 4);
            cD = cD.substring(4);
        } else if (f.substring(_i, _i + 1) == "m") {
            m = cD.substring(0, 2);
            cD = cD.substring(2);
        } else if (f.substring(_i, _i + 1) == "d") {
            d = cD.substring(0, 2);
            cD = cD.substring(2);
        } else if (f.substring(_i, _i + 1) == "H") {
            H = cD.substring(0, 2);
            cD = cD.substring(2);
        } else if (f.substring(_i, _i + 1) == "i") {
            i = cD.substring(0, 2);
            cD = cD.substring(2);
        } else if (f.substring(_i, _i + 1) == "s") {
            s = cD.substring(0, 2);
            cD = cD.substring(2);
        } else if (
            f.substring(_i, _i + 1) == "/" ||
            f.substring(_i, _i + 1) == "-" ||
            f.substring(_i, _i + 1) == " " ||
            f.substring(_i, _i + 1) == ":"
        ) {
            cD = cD.substring(1);
        }
    }
    return Math.round(new Date(Y + "/" + m + "/" + d + " " + H + ":" + i + ":" + s).getTime() / 1000);
};

////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
//Buscar z-index mas alto
_.zIndex = function () {
    var fndZIdx = 0;
    var elmIdx = 0;
    var fndZIdxOb = document.querySelectorAll("*");

    Object.keys(fndZIdxOb).forEach(function (key) {
        elmIdx++;
        if (window.getComputedStyle) {
            var zidx = document.defaultView.getComputedStyle(fndZIdxOb[key], null).getPropertyValue('z-index');
            if (Number(zidx) > fndZIdx) fndZIdx = Number(zidx);
        } else if (fndZIdxOb[key].currentStyle) {
            var zidx = fndZIdxOb[key].currentStyle['z-index'];
            if (Number(zidx) > fndZIdx) fndZIdx = Number(zidx);
        }
    });
    if (fndZIdx < elmIdx) fndZIdx = Number(elmIdx);
    return fndZIdx;
};


////////////////////////*********************************///////////////
////////////////////////////////////////////////////////////////////////
//////////////////////////////AJAX//////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////

var _HTTPRequest = function _HTTPRequest(url, mt, pd, hd, dl, fnm, timeOut) {
    _classCallCheck(this, _HTTPRequest);
    _defineProperty(this, "awF", function (r) { });
    _defineProperty(this, "err", function (r) { });
    _defineProperty(this, "upg", function (r) { });
    _defineProperty(this, "dpg", function (r) { });
    _defineProperty(this, "url", url);
    _defineProperty(this, "type", mt);
    _defineProperty(this, "xhr", new XMLHttpRequest());
    _defineProperty(this, "getHeader", function (h) {
        return this.xhr.getResponseHeader(h);
    });
    _defineProperty(this, "getAllHeader", this.xhr.getAllResponseHeaders);
    _defineProperty(this, "always", function (f) {
        this.awF = f;
        return this;
    });
    _defineProperty(this, "error", function (f) {
        this.err = f;
        return this;
    });
    _defineProperty(this, "uploadProgress", function (f) {
        this.upg = f;
        return this;
    });
    _defineProperty(this, "downloadProgress", function (f) {
        this.dpg = f;
        return this;
    });
    _defineProperty(this, "progress", function (f) {
        this.dpg = f;
        return this;
    });

    if (timeOut == undefined || timeOut == null) timeOut = 1800000;
    var HTTPRequest = this;
    this.xhr.open(mt, url, true);
    this.xhr.timeout = timeOut;
    var DT = null;
    if (mt == "POST") {
        if (pd instanceof Element || pd instanceof HTMLDocument)
            DT = pd;
        else if (_typeof(pd) == "string")
            DT = pd;
        else if (_typeof(pd) == "object") {
            if (pd instanceof FormData) {
                DT = pd;
            } else {
                this.xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                Object.keys(pd).forEach(function (key) {
                    if (DT == null) DT = "";
                    if (DT != "") DT += "&";
                    DT += encodeURIComponent(key).replace(/%20/g, '+') + "=" + encodeURIComponent(pd[key]).replace(/%20/g, '+');
                });
            }
        }
    }
    Object.keys(_.AjaxConfig_H).forEach(function (key) {
        HTTPRequest.xhr.setRequestHeader(key, _.AjaxConfig_H[key]);
    });

    if (hd) {
        Object.keys(hd).forEach(function (key) {
            HTTPRequest.xhr.setRequestHeader(key, hd[key]);
        });
    }

    if (dl) { //Descargamos el contenido en blob
        HTTPRequest.xhr.responseType = "blob";
    }

    this.xhr.upload.addEventListener("progress", function (evt) {
        HTTPRequest.pgEvt(evt, HTTPRequest.upg);
    });

    this.xhr.onprogress = function (evt) {
        HTTPRequest.pgEvt(evt, HTTPRequest.dpg);
    };

    this.pgEvt = function (evt, f) {
        if (evt.lengthComputable) {
            var percentComplete = evt.loaded / (evt.total / 100);
            var fRt = {
                func: f
            };
            for (var vidx in evt) {
                fRt[vidx] = evt[vidx];
            }
            fRt.func(percentComplete);
        }
    };

    this.xhr.onreadystatechange = function () {
        if (this.readyState == '4') {
            if (dl) {
                if (this.status == 200 || this.status == 304) {
                    var iOSiPadOS = /^iP/.test(navigator.platform) ||
                        /^Mac/.test(navigator.platform) && navigator.maxTouchPoints > 4;
                    if (window.webView) {
                        let blob = this.response;
                        var reader = new FileReader();
                        reader.readAsDataURL(blob);
                        reader.onloadend = function () {
                            var base64String = reader.result.split(",")[1];
                            console.log("File:" + fnm + ":" + base64String);
                            console.log("File2.0:" + fnm + ":" + HTTPRequest.xhr.getResponseHeader("Content-Type") + ":" + base64String);
                        }
                    } else if (_typeof(window.chrome) !== 'undefined') {
                        // Chrome version
                        var link = document.createElement('a');
                        link.href = window.URL.createObjectURL(this.response);
                        link.download = fnm;
                        link.click();
                    } else if (_typeof(window.navigator.msSaveBlob) !== 'undefined') {
                        // IE version
                        var blob = new Blob([this.response], { type: 'application/force-download' });
                        window.navigator.msSaveBlob(blob, fnm);
                    } else if (iOSiPadOS) {
                        // IOS Version
                        var DV = document.createElement('div');
                        DV.style.position = 'fixed';
                        DV.style.width = '100%';
                        DV.style.height = '100%';
                        DV.style.top = '0';
                        DV.style.left = '0';
                        DV.style.backgroundColor = '#000000b0';

                        var BT = document.createElement('button');
                        BT.style.position = 'fixed';
                        BT.style.width = '90%';
                        BT.style.top = '50%';
                        BT.style.left = '0';
                        BT.style.fontSize = '30px';
                        BT.style.backgroundColor = '#2575fc';
                        BT.style.color = '#FFF';
                        BT.style.padding = '5%';
                        BT.style.margin = '5%';
                        BT.style.borderRadius = '10px';
                        BT.innerHTML = 'Guardar';

                        DV.appendChild(BT);

                        var CLS = document.createElement('button');
                        CLS.style.position = 'fixed';
                        CLS.style.width = '40px';
                        CLS.style.height = '40px';
                        CLS.style.top = '0';
                        CLS.style.right = '0';
                        CLS.style.fontSize = '20px';
                        CLS.style.backgroundColor = '#2575fc';
                        CLS.style.color = '#FFF';
                        CLS.style.borderRadius = '10px';
                        CLS.innerHTML = 'X';

                        DV.appendChild(CLS);
                        document.body.appendChild(DV);

                        BT.addEventListener('click', () => {
                            _(DV).remove();
                            var blob = new Blob([this.response], { type: 'application/force-download' });
                            var url = URL.createObjectURL(blob);
                            var anchor = document.createElement('a');
                            document.body.appendChild(anchor);
                            anchor.href = url;
                            anchor.download = fnm;
                            anchor.click();
                            document.body.removeChild(anchor);
                        });

                        CLS.addEventListener('click', () => {
                            _(DV).remove();
                        });

                    } else {
                        // Firefox version
                        var file = new File([this.response], fnm, { type: 'application/force-download' });
                        window.open(URL.createObjectURL(file));
                    }
                    HTTPRequest.awF(true);
                } else {
                    HTTPRequest.do(false, 1, this.response);
                }
            } else {
                HTTPRequest.do(1, null, this.response);
            }
            if (_.Between(this.status, 400, 599) || this.status == 0) {
                HTTPRequest.err(this.response);
            }
        }
    };

    this.do = function (r1, r2, d) {
        let Data = d;
        if (d instanceof Blob) {
            let bl = new FileReader();
            bl.addEventListener('loadend', (e) => {
                HTTPRequest.do_Exe(r1, r2, e.target.result);
            });
            bl.readAsText(Data);
        } else {
            HTTPRequest.do_Exe(r1, r2, d);
        }
    };

    this.do_Exe = function (r1, r2, d) {
        var hdrs = HTTPRequest.xhr.getResponseHeader("Content-Type");
        if (hdrs) {
            hdrs = hdrs.split(";");
            if (hdrs[0] == "application/json") {
                var JSRp;
                try {
                    JSRp = JSON.parse(d.trim());
                } catch (e) {
                    JSRp = d;
                }
                HTTPRequest.awF(r1 === 1 ? JSRp : r1, r2 === 1 ? JSRp : r2);
            } else {
                HTTPRequest.awF(r1 === 1 ? d : r1, r2 === 1 ? d : r2);
            }
        } else {
            HTTPRequest.awF("");
        }
    };
    this.xhr.send(DT);
};

_.AjaxConfig_H = [];
_.AjaxConfig = function (c) {
    if (c.headers) {
        _.AjaxConfig_H = c.headers;
    }
};
_.get = function (url, headers, timeOut) {
    var Rq = new _HTTPRequest(url, "GET", null, headers, false, null, timeOut);
    return Rq;
};
_.post = function (url, pd, headers, timeOut) {
    var Rq = new _HTTPRequest(url, "POST", pd, headers, false, null, timeOut);
    return Rq;
};
_.get.download = function (url, headers, fname, timeOut) {
    var Rq = new _HTTPRequest(url, "GET", null, headers, true, fname, timeOut);
    return Rq;
};
_.post.download = function (url, pd, headers, fname, timeOut) {
    var Rq = new _HTTPRequest(url, "POST", pd, headers, true, fname, timeOut);
    return Rq;
};
_.form = function (a) {
    if (_typeof(a) == 'object') {
        var o = new FormData();
        _.each(a, function (idx, val) {
            o.append(idx, val);
        });
        return o;
    }
    return null;
};

////////////////////*********************************///////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
var alert_Timer = null;
//Mensaje Alerta
//m = mensaje
//i = icono (Alert, Error, Info, Ok)
//t = tiempo en segundos que será visible
var alert = function (m, i, t) {
    //Revisar si existe el div principal
    var Al = _('#alert_Mensaje');
    //Si no existe lo creamos
    if (Al == null || Al == undefined) {

        Al = document.createElement("div");
        Al.id = "alert_Mensaje";
        Al.classList.add('alert_Mensaje_Contenedor');
        _(Al).css('z-index', _.zIndex() + 1);
        document.body.appendChild(Al);
    } else {
        Al = Al.Obj[0];
    }
    if (_typeof(m) == 'string') {
        if (m != "") {
            if (i == undefined) i = "Alert";
            var CTm = Math.round((new Date()).getTime());
            var AlM = document.createElement("div");
            AlM.classList.add('alert_Mensaje_Mensaje');
            AlM.classList.add('alert_Mensaje_Mensaje_' + i);
            var ATF = document.createElement("div");
            ATF.classList.add('alert_Text_Info');
            ATF.innerHTML = m;
            if (t == undefined)
                AlM.setAttribute('tm', 5000);
            else
                AlM.setAttribute('tm', (t * 1000));
            AlM.setAttribute('ti', CTm);
            var ClB = document.createElement("div");
            ClB.classList.add('alert_btn_close');
            ClB.innerHTML = "<i class='lexx lexx_times'></i>";
            ClB.addEventListener('click', function () { _(this).parent().hide(0, function () { this.remove(); }); });
            var ICN = document.createElement("span");
            ICN.classList.add('alert_Icon_Span');
            ICN.innerHTML = "<span></span>";
            AlM.appendChild(ICN);
            AlM.appendChild(ATF);
            AlM.appendChild(ClB);
            _(AlM).css('display', 'flex');
            Al.appendChild(AlM);
        }
    }
    if (!alert_Timer)
        alert_Timer = setInterval(alert_RevTiempo, 1000);
};

function alert_RevTiempo() {
    var q = _('#alert_Mensaje > div');
    if (q != null) {
        var CTm = Math.round((new Date()).getTime());
        Object.keys(q).forEach(function (key) {
            if (!isNaN(key))
                if (Number(q[key].attr('tm')) <= (CTm - Number(q[key].attr('ti')))) {
                    if (q[key].attr('del') != '1') {
                        q[key].attr('del', 1);
                        q[key].hide(0, function () { _(this).remove(); });
                    } else {
                        if (q[key].css('opacity') == '0') {
                            q[key].remove();
                        }
                    }
                }
        });
    } else {
        clearInterval(alert_Timer);
        alert_Timer = null;
    }
}

////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
// Ventana Loading
//_.Loading o _.Cargando
//o = json;
//mostrar true o false, muestra u oculta la ventana
//porcentaje float muestra barra de porcentaje y muestra gráfica de %
//mensaje muestra texto asignado sobre la barra de porcentaje

_.Loading = function (o) {
    var Contenedor = _('#Lexx_Ventana_Cargando');
    //Si no existe la estructura, la creamos
    if (Contenedor == null) {
        var Contenedor = document.createElement("div");
        Contenedor.id = 'Lexx_Ventana_Cargando';
        Contenedor.classList.add('Lexx_Ventana_Cargando');
        var Div1 = document.createElement("div");
        Div1.classList.add('Lexx_Ventana_Cargando_overlay');
        Contenedor.appendChild(Div1);
        var Div2 = document.createElement("div");
        Div2.classList.add('Lexx_Ventana_Cargando_center');
        Div1.appendChild(Div2);
        var Div3 = document.createElement("div");
        Div3.classList.add('Lexx_Ventana_Cargando_spinner_container');
        Div2.appendChild(Div3);
        var Div4 = document.createElement("div");
        Div4.classList.add('Lexx_Ventana_Cargando_spinner');
        Div3.appendChild(Div4);
        for (var i = 0; i <= 2; i++) {
            var DivB = document.createElement("div");
            DivB.classList.add('Lexx_Ventana_Cargando_spinner_animacion');
            Div4.appendChild(DivB);
        }

        var Div5 = document.createElement("div");
        Div5.classList.add('Lexx_Ventana_Cargando_Progreso');
        Div2.appendChild(Div5);
        var Div6 = document.createElement("div");
        Div6.classList.add('Lexx_Ventana_Cargando_Progreso_Bar');
        Div5.appendChild(Div6);
        var Span1 = document.createElement("span");
        Span1.classList.add('Lexx_Ventana_Cargando_Progreso_Mensaje');
        Span1.innerHTML = "Cargando.. 100%";
        Div6.appendChild(Span1);
        var Div7 = document.createElement("div");
        Div7.classList.add('Lexx_Ventana_Cargando_Animacion');
        Div6.appendChild(Div7);
        document.body.appendChild(Contenedor);
        Contenedor = _('#Lexx_Ventana_Cargando');
        Contenedor.css('z-index', _.zIndex() + 1)
    }

    if (_typeof(o.mostrar) == 'boolean') {
        if (o.mostrar) {
            Contenedor.removeClass('Lexx_ocultar');
        } else {
            Contenedor.addClass('Lexx_ocultar');
        }
    }
    if (o.porcentaje) {
        var pN = parseInt(o.porcentaje);
        if (_.Between(pN, 0, 100)) {
            Contenedor.find('.Lexx_Ventana_Cargando_Progreso').show();
            Contenedor.find('.Lexx_Ventana_Cargando_Animacion').css('width', pN + '%');
        }
    } else {
        Contenedor.find('.Lexx_Ventana_Cargando_Progreso').hide();
    }

    if (o.mensaje) {
        Contenedor.find('.Lexx_Ventana_Cargando_Progreso_Mensaje').html(o.mensaje);
    }
};
_.Cargando = _.Loading;

////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////// Calendario //////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
//Formato de calendario JSON Global;
//formato = que en PHP (YmdHis) defecto "Y/m/d H:i:s"
//botonHoy = boolean defecto false
//botonCerrar = boolean defecto false
//hora = boolean defecto false
//tema = nombreTema defecto Dark (Dark, Light, Blue, Green, White)
_.CalendarioConfig = {
    formato: "Y/m/d",
    botonHoy: false,
    botonCerrar: false,
    tema: "Dark",
    minA: 1920,
    maxA: 2030
};
var _Calendario = function _Calendario(_e, c) {
    _defineProperty(this, "CalendarioConfig", {});
    _classCallCheck(this, _Calendario);
    _defineProperty(this, "Obj", null);
    _defineProperty(this, "calendar", null);
    if (c == null || c == undefined) c = {};

    this.CalendarioConfig.formato = _.CalendarioConfig.formato;
    this.CalendarioConfig.botonHoy = _.CalendarioConfig.botonHoy;
    this.CalendarioConfig.botonCerrar = _.CalendarioConfig.botonCerrar;
    this.CalendarioConfig.tema = _.CalendarioConfig.tema;
    this.CalendarioConfig.minA = _.CalendarioConfig.minA;
    this.CalendarioConfig.maxA = _.CalendarioConfig.maxA;
    if (c.formato) this.CalendarioConfig.formato = c.formato;
    if (c.botonHoy) this.CalendarioConfig.botonHoy = c.botonHoy;
    if (c.botonCerrar) this.CalendarioConfig.botonCerrar = c.botonCerrar;
    if (c.tema) this.CalendarioConfig.tema = c.tema;
    if (c.minA) this.CalendarioConfig.minA = c.minA;
    if (c.maxA) this.CalendarioConfig.maxA = c.maxA;

    _defineProperty(this, "blur", function () {
        var cls = document.activeElement.classList;
        var classF = false;
        Object.keys(cls).forEach(function (key) {
            if (cls[key] == 'Lex_Calendario_Container' || cls[key] == 'Lex_Calendario_Select_M' || cls[key] == 'Lex_Calendario_Select_A') classF = true;
        });
        if (!classF) this.calendar.remove();
    });

    _defineProperty(this, "addMonth", function () {
        this.selM = Number(this.selM) + 1;
        this.actualizar();
    });

    _defineProperty(this, "lessMonth", function () {
        this.selM = Number(this.selM) - 1;
        this.actualizar();
    });

    _defineProperty(this, "click", function (e) {
        var d = e.querySelectorAll('span');

        if (d.length > 0) {
            d = d[0].innerHTML;

            if (d != "") {
                this.selD = Number(d);
                this.actualizar();
                this.asignar(_.date(classOb.CalendarioConfig.formato, Math.round(new Date(Number(this.selA), Number(this.selM) - 1, Number(this.selD)).getTime() / 1000)));
                this.calendar.remove();
            }
        }
    });

    _defineProperty(this, "asignar", function (q) {
        if (this.Obj instanceof HTMLInputElement) this.Obj.value = q; else this.Obj.innerText = q;
        this.Obj.dispatchEvent(new Event('ondate'));
    });

    _defineProperty(this, "actualizar", function () {
        var fAct = new Date();
        this.orgFch = new Date(Number(this.selA), Number(this.selM) - 1, 1);
        this.selA = this.orgFch.getFullYear();
        this.selM = this.orgFch.getMonth() + 1;

        _('.Lex_Calendario_Select_A').val(this.selA);

        _('.Lex_Calendario_Select_M').val(Number(this.selM));

        var pD = new Date(Number(this.selA), Number(this.selM) - 1, 1);
        var uD = new Date(Number(this.selA), Number(this.selM), 0);
        var nPD = pD.getDay();
        if (nPD == 0) nPD = 7;
        nPD--;
        var tds = this.calendar.querySelectorAll("td");

        for (var cD = 0; cD < tds.length; cD++) {
            tds[cD].innerHTML = '';
        }

        for (var cD = nPD; cD < uD.getDate() + nPD; cD++) {
            var DiaS = '<span>' + (cD - nPD + 1) + '</span>';
            if (fAct.getFullYear() == Number(this.selA) && fAct.getMonth() + 1 == Number(this.selM)) if (fAct.getDate() == cD - nPD + 1) DiaS = '<span class="Lex_Calendario_Dia_Selecionado">' + (cD - nPD + 1) + '</span>';
            if (cD - nPD + 1 == this.selD) DiaS = '<span class="Lex_Calendario_Dia_Activo">' + (cD - nPD + 1) + '</span>';
            tds[cD].innerHTML = DiaS;
        }
    });

    this.Obj = _e;
    var classOb = this;
    _e.addEventListener('ondate', function () {
        if (_(classOb.Obj).attr('ondate')) {
            eval(_(classOb.Obj).attr('ondate'));
        }
    });

    _(_e).attr('readonly', true);
    _(_e).attr('contenteditable', false);

    _e.addEventListener("click", function () {
        var RAC = _('.Lex_Calendario_Container');
        if (RAC) RAC.remove();
        classOb.calendar = document.createElement("div");
        classOb.calendar.classList.add('Lex_Calendario_Theme_' + classOb.CalendarioConfig.tema);
        classOb.calendar.classList.add('Lex_Calendario_Container'); //agregamos el calendario

        document.body.appendChild(classOb.calendar); //Obtenemos la posición del objeto que invocó y sus dimensiones

        var rectO = classOb.Obj.getBoundingClientRect();
        var rectCal = classOb.calendar.getBoundingClientRect();
        var sumDif = 0;
        if (rectO.width > rectCal.width) sumDif = (rectO.width - rectCal.width) / 2;
        classOb.calendar.style.left = rectO.left + sumDif + 0 + 'px';
        classOb.calendar.style.top = rectO.top + rectO.height + 'px';
        classOb.calendar.style.zIndex = _.zIndex() + 1;
        classOb.calendar.setAttribute('tabindex', '0');
        var DT = '';
        DT += '    <div class="Lex_Calendario_Header">';
        DT += '        <span class="Lex_Calendario_Navegacion lexx_chevron_left_b Lex_Calendario_Navegacion_Pre"></span>';
        DT += '        <select class="Lex_Calendario_Seleccion Lex_Calendario_Select_M">';
        DT += '            <option value="1">Enero</option>';
        DT += '            <option value="2">Febrero</option>';
        DT += '            <option value="3">Marzo</option>';
        DT += '            <option value="4">Abril</option>';
        DT += '            <option value="5">Mayo</option>';
        DT += '            <option value="6">Junio</option>';
        DT += '            <option value="7">Julio</option>';
        DT += '            <option value="8">Agosto</option>';
        DT += '            <option value="9">Septiembre</option>';
        DT += '            <option value="10">Octubre</option>';
        DT += '            <option value="11">Noviembre</option>';
        DT += '            <option value="12">Diciembre</option>';
        DT += '        </select>';
        DT += '        <select class="Lex_Calendario_Seleccion Lex_Calendario_Select_A">';

        for (var a = classOb.CalendarioConfig.minA; a <= classOb.CalendarioConfig.maxA; a++) {
            DT += '            <option value="' + a + '">' + a + '</option>';
        }

        DT += '        </select>';
        DT += '        <span class="Lex_Calendario_Navegacion lexx_chevron_right_b Lex_Calendario_Navegacion_Next"></span>';
        DT += '    </div>';
        DT += '    <div class="Lex_Calendario_Contenedor_Tabla">';
        DT += '        <table class="Lex_Calendario_Tabla">';
        DT += '            <thead>';
        DT += '                <tr class="Lex_Calendario_Dias_Semana">';
        DT += '                    <th>lu</th>';
        DT += '                    <th>ma</th>';
        DT += '                    <th>mi</th>';
        DT += '                    <th>ju</th>';
        DT += '                    <th>vi</th>';
        DT += '                    <th>sá</th>';
        DT += '                    <th>do</th>';
        DT += '                </tr>';
        DT += '            </thead>';
        DT += '            <tbody>';

        for (var cW = 1; cW <= 6; cW++) {
            DT += '                <tr class="Lex_Calendario_Dias_Numero">';

            for (var cD = 1; cD <= 7; cD++) {
                DT += '                    <td><span></span></td>';
            }

            DT += '                </tr>';
        }

        DT += '            </tbody>';
        DT += '        </table>';
        DT += '    </div>';
        DT += '    <div class="Lex_Calendario_Pie">';
        DT += '        <div class="Lex_Calendario_Pie_Boton Lex_Calendario_Hoy">Hoy</div>';
        DT += '        <div class="Lex_Calendario_Pie_Boton Lex_Calendario_Cerrar">Cerrar</div>';
        DT += '    </div>';
        classOb.calendar.innerHTML = DT;
        classOb.calendar.focus();
        classOb.calendar.addEventListener("blur", function () {
            setTimeout(function () {
                classOb.blur();
            }, 5);
        });
        var navB = classOb.calendar.querySelectorAll('.Lex_Calendario_Navegacion');
        navB[0].addEventListener("click", function () {
            classOb.lessMonth();
        });
        navB[1].addEventListener("click", function () {
            classOb.addMonth();
        });
        var navB = classOb.calendar.querySelectorAll('.Lex_Calendario_Select_A');
        navB[0].addEventListener("change", function () {
            classOb.selA = this.value;
            classOb.actualizar();
        });
        navB[0].addEventListener("blur", function () {
            setTimeout(function () {
                classOb.blur();
            }, 5);
        });
        var navB = classOb.calendar.querySelectorAll('.Lex_Calendario_Select_M');
        navB[0].addEventListener("change", function () {
            classOb.selM = this.value;
            classOb.actualizar();
        });
        navB[0].addEventListener("blur", function () {
            setTimeout(function () {
                classOb.blur();
            }, 5);
        });
        var navB = classOb.calendar.querySelectorAll('td');
        Object.keys(navB).forEach(function (key) {
            navB[key].addEventListener("click", function () {
                classOb.click(this);
            });
        });
        var navB = classOb.calendar.querySelectorAll('.Lex_Calendario_Hoy');
        if (!classOb.CalendarioConfig.botonHoy) navB[0].style.display = 'none';
        navB[0].addEventListener("click", function () {
            classOb.asignar(_.date(classOb.CalendarioConfig.formato, Math.round(new Date().getTime() / 1000)));
            classOb.calendar.remove();
        });
        var navB = classOb.calendar.querySelectorAll('.Lex_Calendario_Cerrar');
        if (!classOb.CalendarioConfig.botonCerrar) navB[0].style.display = 'none';
        navB[0].addEventListener("click", function () {
            classOb.calendar.remove();
        });

        if (!classOb.CalendarioConfig.botonCerrar && !classOb.CalendarioConfig.botonHoy) {
            var navB = classOb.calendar.querySelectorAll('.Lex_Calendario_Pie');
            navB[0].style.display = 'none';
        }

        var fAct = new Date();
        if (this.Obj instanceof HTMLInputElement) classOb.aDT = classOb.Obj.value; else classOb.aDT = classOb.Obj.innerText;

        if (classOb.aDT != "") {
            try {
                classOb.aDT = _.toUnix(classOb.aDT, classOb.CalendarioConfig.formato);
            } catch (e) { }

            ;
        }

        if (isNaN(classOb.aDT) || classOb.aDT == "") classOb.aDT = Math.round(fAct.getTime() / 1000);
        classOb.selA = _.date("Y", classOb.aDT);
        classOb.selM = _.date("m", classOb.aDT);
        classOb.selD = _.date("d", classOb.aDT);
        classOb.actualizar();
    });
};



////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////// Calendario Doble ////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
//Formato de calendario JSON Global;
//formato = que en PHP (YmdHis) defecto "Y/m/d H:i:s"
//botonHoy = boolean defecto false
//botonCerrar = boolean defecto false
//hora = boolean defecto false
//tema = nombreTema defecto Dark (Dark, Light, Blue, Green, White)
_.CalendarioDobleConfig = {
    formato: "Y/m/d",
    botonHoy: false,
    botonCerrar: false,
    tema: "Dark",
    minA: 1920,
    maxA: 2030
};
var _CalendarioDoble = function _CalendarioDoble(_e, c) {
    _defineProperty(this, "CalendarioConfig", {});
    _classCallCheck(this, _CalendarioDoble);
    _defineProperty(this, "Obj", null);
    _defineProperty(this, "calendar", null);
    if (c == null || c == undefined) c = {};

    this.CalendarioConfig.formato = _.CalendarioConfig.formato;
    this.CalendarioConfig.botonHoy = _.CalendarioConfig.botonHoy;
    this.CalendarioConfig.botonCerrar = _.CalendarioConfig.botonCerrar;
    this.CalendarioConfig.tema = _.CalendarioConfig.tema;
    this.CalendarioConfig.minA = _.CalendarioConfig.minA;
    this.CalendarioConfig.maxA = _.CalendarioConfig.maxA;
    if (c.formato) this.CalendarioConfig.formato = c.formato;
    if (c.botonHoy) this.CalendarioConfig.botonHoy = c.botonHoy;
    if (c.botonCerrar) this.CalendarioConfig.botonCerrar = c.botonCerrar;
    if (c.tema) this.CalendarioConfig.tema = c.tema;
    if (c.minA) this.CalendarioConfig.minA = c.minA;
    if (c.maxA) this.CalendarioConfig.maxA = c.maxA;
    if (c.left) this.cLeft = c.left;
    if (c.top) this.cTop = c.top;
    this.Desde = 0;
    this.Hasta = 0;
    this.DSelect = false;
    this.HSelect = false;

    _defineProperty(this, "blur", function () {
        var cls = document.activeElement.classList;
        var classF = false;
        Object.keys(cls).forEach(function (key) {
            if (cls[key] == 'Lex_CalendarioDbl_Container' || cls[key] == 'Lex_Calendario_Select_M' || cls[key] == 'Lex_Calendario_Select_A') classF = true;
        });
        if (!classF) this.calendar.remove();
    });

    _defineProperty(this, "addMonth", function () {
        this.selM1 = Number(this.selM1) + 1;
        this.selM2 = this.selM1 + 1;
        this.actualizar();
    });

    _defineProperty(this, "lessMonth", function () {
        this.selM1 = Number(this.selM1) - 1;
        this.selM2 = this.selM1 + 1;
        this.actualizar();
    });

    _defineProperty(this, "click", function (e) {
        let d = e.querySelectorAll('span');
        if (d.length > 0) {
            if (!this.DSelect || Number(this.Desde) >= Number(_(d).attr('cDate'))) {
                this.seldM1 = d[0].getAttribute('mm');
                this.seldA1 = d[0].getAttribute('aa');
                let cd = d[0].innerHTML;
                this.selD = Number(cd);
                this.Desde = _(d).attr('cDate');
                this.DSelect = true;
                _(d).addClass('Lex_Calendario_Dia_Activo');
            } else if (!this.HSelect) {
                this.seldM2 = d[0].getAttribute('mm');
                this.seldA2 = d[0].getAttribute('aa');
                let cd = d[0].innerHTML;
                this.selD2 = Number(cd);
                this.Hasta = _(d).attr('cDate');
                this.HSelect = true;
            }
        }

        if (this.DSelect && this.HSelect) {
            this.asignar(
                _.date(classOb.CalendarioConfig.formato, Math.round(new Date(Number(this.seldA1), Number(this.seldM1) - 1, Number(this.selD)).getTime() / 1000)) + " - " +
                _.date(classOb.CalendarioConfig.formato, Math.round(new Date(Number(this.seldA2), Number(this.seldM2) - 1, Number(this.selD2)).getTime() / 1000))
            );
            this.calendar.remove();
        }
    });

    _defineProperty(this, "mouseover", function (e) {
        let d = e.querySelectorAll('span');
        if (d.length > 0) {
            if (this.DSelect) {
                _('.Lex_CalendarioDbl_Container').find('span').each((idx, val) => {
                    if (val.attr('cDate')) {
                        if (
                            (Number(val.attr('cDate')) >= Number(this.Desde) &&
                                Number(val.attr('cDate')) <= Number(_(d).attr('cDate'))) ||
                            this.Desde == Number(val.attr('cDate'))
                        ) {
                            val.addClass('Lex_Calendario_Dia_Activo_Box_Blur');
                        } else {
                            val.removeClass('Lex_Calendario_Dia_Activo_Box_Blur');
                        }
                    }
                });
            }
        }
    });

    _defineProperty(this, "asignar", function (q) {
        if (this.Obj instanceof HTMLInputElement) this.Obj.value = q; else this.Obj.innerText = q;
        this.Obj.dispatchEvent(new Event('ondate'));
    });

    _defineProperty(this, "actualizar", function () {
        var fAct = new Date();
        this.orgFch1 = new Date(Number(this.selA1), Number(this.selM1) - 1, 1);
        this.orgFch2 = new Date(Number(this.selA1), Number(this.selM1) + 1 - 1, 1);
        this.selA1 = this.orgFch1.getFullYear();
        this.selM1 = this.orgFch1.getMonth() + 1;
        this.selA2 = this.orgFch2.getFullYear();
        this.selM2 = this.orgFch2.getMonth() + 1;

        _('.Lex_Calendario_Select_A')[0].val(this.selA1);
        _('.Lex_Calendario_Select_M')[0].val(Number(this.selM1));

        _('.Lex_Calendario_Select_A')[1].val(this.selA2);
        _('.Lex_Calendario_Select_M')[1].val(Number(this.selM2));

        var pD = new Date(Number(this.selA1), Number(this.selM1) - 1, 1);
        var uD = new Date(Number(this.selA1), Number(this.selM1), 0);
        var nPD = pD.getDay();
        if (nPD == 0) nPD = 7;
        nPD--;
        var tds = this.calendar.querySelectorAll("td");

        for (var cD = 0; cD < tds.length; cD++) {
            tds[cD].innerHTML = '';
        }

        let sD = _.date("Ym", pD.getTime() / 1000);
        for (var cD = nPD; cD < uD.getDate() + nPD; cD++) {
            let uD = sD + ((cD - nPD + 1) < 10 ? '0' + (cD - nPD + 1) : (cD - nPD + 1));
            var DiaS = '<span aa="' + this.selA1 + '" mm="' + this.selM1 + '" cDate="' + uD + '">' + (cD - nPD + 1) + '</span>';
            if (fAct.getFullYear() == Number(this.selA1) && fAct.getMonth() + 1 == Number(this.selM1))
                if (fAct.getDate() == cD - nPD + 1) DiaS = '<span class="Lex_Calendario_Dia_Selecionado" aa="' + this.selA1 + '" mm="' + this.selM1 + '" cDate="' + uD + '">' + (cD - nPD + 1) + '</span>';
            if (Number(uD) >= this.Desde && Number(uD) <= this.Hasta)
                DiaS = '<span class="Lex_Calendario_Dia_Activo_Box" aa="' + this.selA1 + '" mm="' + this.selM1 + '" cDate="' + uD + '">' + (cD - nPD + 1) + '</span>';
            tds[cD].innerHTML = DiaS;
        }

        var pD = new Date(Number(this.selA2), Number(this.selM2) - 1, 1);
        var uD = new Date(Number(this.selA2), Number(this.selM2), 0);
        var nPD = pD.getDay();
        if (nPD == 0) nPD = 7;
        nPD--;

        sD = _.date("Ym", pD.getTime() / 1000);
        for (var cD = nPD; cD < uD.getDate() + nPD; cD++) {
            let uD = sD + ((cD - nPD + 1) < 10 ? '0' + (cD - nPD + 1) : (cD - nPD + 1));
            var DiaS = '<span aa="' + this.selA2 + '" mm="' + this.selM2 + '" cDate="' + uD + '">' + (cD - nPD + 1) + '</span>';
            if (fAct.getFullYear() == Number(this.selA2) && fAct.getMonth() + 1 == Number(this.selM2))
                if (fAct.getDate() == cD - nPD + 1) DiaS = '<span class="Lex_Calendario_Dia_Selecionado" aa="' + this.selA2 + '" mm="' + this.selM2 + '" cDate="' + uD + '">' + (cD - nPD + 1) + '</span>';
            if (Number(uD) >= this.Desde && Number(uD) <= this.Hasta)
                DiaS = '<span class="Lex_Calendario_Dia_Activo_Box" aa="' + this.selA2 + '" mm="' + this.selM2 + '" cDate="' + uD + '">' + (cD - nPD + 1) + '</span>';
            tds[cD + 42].innerHTML = DiaS;
        }
    });

    this.Obj = _e;
    var classOb = this;
    _e.addEventListener('ondate', function () {
        if (_(classOb.Obj).attr('ondate')) {
            eval(_(classOb.Obj).attr('ondate'));
        }
    });

    _(_e).attr('readonly', true);
    _(_e).attr('contenteditable', false);

    _e.addEventListener("click", function () {
        classOb.DSelect = false;
        classOb.HSelect = false;
        var RAC = _('.Lex_CalendarioDbl_Container');
        if (RAC) RAC.remove();

        classOb.calendar = document.createElement("div");
        classOb.calendar.classList.add('Lex_Calendario_Theme_' + classOb.CalendarioConfig.tema);
        classOb.calendar.classList.add('box__wrapper__calendar');
        classOb.calendar.classList.add('Lex_CalendarioDbl_Container'); //agregamos el calendario

        //document.body.appendChild(classOb.calendar); //Obtenemos la posición del objeto que invocó y sus dimensiones
        const dialog = classOb.Obj.closest(".dbcalendar_dialog");

        if (dialog) {
            // Si existe, lo agregamos ahí
            dialog.appendChild(classOb.calendar);
        } else {
            // Si no existe ningún .dbcalendar_dialog en la jerarquía, va al body
            document.body.appendChild(classOb.calendar);
        }

        // var pos_CalendarioDbl = document.querySelector(".__calendario__doble");

        // pos_CalendarioDbl.appendChild(classOb.calendar); //Obtenemos la posición del objeto que invocó y sus dimensiones

        var rectO = classOb.Obj.getBoundingClientRect();
        var rectCal = classOb.calendar.getBoundingClientRect();
        var sumDif = 0;
        if (rectO.width > rectCal.width) sumDif = (rectO.width - rectCal.width) / 2;

        classOb.calendar.style.left = (classOb.cLeft ? classOb.cLeft : rectO.left + sumDif + 8 + 'px');
        classOb.calendar.style.top = (classOb.cTop ? classOb.cTop : rectO.top + rectO.height + 'px');
        classOb.calendar.style.zIndex = _.zIndex() + 1;
        classOb.calendar.setAttribute('tabindex', '0');

        let year = '';

        for (var a = classOb.CalendarioConfig.minA; a <= classOb.CalendarioConfig.maxA; a++) {
            year += '            <option value="' + a + '">' + a + '</option>';
        }

        let year2 = '';

        for (var a = classOb.CalendarioConfig.minA; a <= classOb.CalendarioConfig.maxA; a++) {
            year2 += '            <option value="' + a + '">' + a + '</option>';
        }

        let Days = '';

        for (var cW = 1; cW <= 6; cW++) {
            Days += '                <tr class="Lex_Calendario_Dias_Numero">';

            for (var cD = 1; cD <= 7; cD++) {
                Days += '                    <td><span></span></td>';
            }

            Days += '                </tr>';
        }

        let Days2 = '';
        for (var cW = 1; cW <= 6; cW++) {
            Days2 += '                <tr class="Lex_Calendario_Dias_Numero">';
            for (var cD = 1; cD <= 7; cD++) {
                Days2 += '                    <td><span></span></td>';
            }
            Days2 += '                </tr>';
        }

        var DT = /*HTML*/`
            <div class="flex box__calendar__multiple">
                <div class="flex_100 box__calendar__multiple__unix">
                    <div class="Lex_Calendario_Header box__calendar__multiple__header">
                        <span class="Lex_Calendario_Navegacion box__calendar__multiple__header__nav box__calendar__multiple__header__nav__back lexx_chevron_left_b Lex_Calendario_Navegacion_Pre">
                        </span>
                        <select class="Lex_Calendario_Seleccion box__calendar__multiple__header__sel Lex_Calendario_Select_M">
                            <option value="1">Enero</option>
                            <option value="2">Febrero</option>
                            <option value="3">Marzo</option>
                            <option value="4">Abril</option>
                            <option value="5">Mayo</option>
                            <option value="6">Junio</option>
                            <option value="7">Julio</option>
                            <option value="8">Agosto</option>
                            <option value="9">Septiembre</option>
                            <option value="10">Octubre</option>
                            <option value="11">Noviembre</option>
                            <option value="12">Diciembre</option>
                        </select>
                        <select class="Lex_Calendario_Seleccion box__calendar__multiple__header__sel Lex_Calendario_Select_A">
                            ${year}
                        </select>
                        <div class="flex_100 flex justify_end">
                            <span class="Lex_Calendario_Navegacion box__calendar__multiple__header__nav box__calendar__multiple__header__nav__next lexx_chevron_left_b Lex_Calendario_Navegacion_Next">
                            </span>
                        </div>
                    </div>
                    <div class="Lex_CalendarioDbl_Contenedor_Tabla box__calendar__multiple__table">
                        <table class="Lex_Calendario_Tabla">
                            <thead>
                                <tr class="Lex_Calendario_Dias_Semana box__calendar__multiple__table__row">
                                    <th>lu</th>
                                    <th>ma</th>
                                    <th>mi</th>
                                    <th>ju</th>
                                    <th>vi</th>
                                    <th>sá</th>
                                    <th>do</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${Days}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div class="flex_100 box__calendar__multiple__unix">
                    <div class="Lex_Calendario_Header box__calendar__multiple__header">
                        <span class="Lex_Calendario_Navegacion box__calendar__multiple__header__nav box__calendar__multiple__header__nav__back lexx_chevron_left_b Lex_Calendario_Navegacion_Pre">
                        </span>
                        <select class="Lex_Calendario_Seleccion box__calendar__multiple__header__sel Lex_Calendario_Select_M">
                            <option value="1">Enero</option>
                            <option value="2">Febrero</option>
                            <option value="3">Marzo</option>
                            <option value="4">Abril</option>
                            <option value="5">Mayo</option>
                            <option value="6">Junio</option>
                            <option value="7">Julio</option>
                            <option value="8">Agosto</option>
                            <option value="9">Septiembre</option>
                            <option value="10">Octubre</option>
                            <option value="11">Noviembre</option>
                            <option value="12">Diciembre</option>
                        </select>
                        <select class="Lex_Calendario_Seleccion box__calendar__multiple__header__sel Lex_Calendario_Select_A">
                            ${year2}
                        </select>
                        <div class="flex_100 flex justify_end">
                            <span class="Lex_Calendario_Navegacion box__calendar__multiple__header__nav box__calendar__multiple__header__nav__next lexx_chevron_left_b Lex_Calendario_Navegacion_Next">
                            </span>
                        </div>
                    </div>
                    <div class="Lex_CalendarioDbl_Contenedor_Tabla box__calendar__multiple__table">
                        <table class="Lex_Calendario_Tabla">
                            <thead>
                                <tr class="Lex_Calendario_Dias_Semana box__calendar__multiple__table__row">
                                    <th>lu</th>
                                    <th>ma</th>
                                    <th>mi</th>
                                    <th>ju</th>
                                    <th>vi</th>
                                    <th>sá</th>
                                    <th>do</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${Days2}
                            </tbody>
                        </table>
                    </div>
                    <div class="Lex_Calendario_Pie">
                        <div class="Lex_Calendario_Pie_Boton Lex_Calendario_Hoy">Hoy</div>
                        <div class="Lex_Calendario_Pie_Boton Lex_Calendario_Cerrar">Cerrar</div>
                    </div>
                </div>
            </div>
            `;
        classOb.calendar.innerHTML = DT;
        classOb.calendar.focus();
        classOb.calendar.addEventListener("blur", function () {
            setTimeout(function () {
                classOb.blur();
            }, 5);
        });
        var navB = classOb.calendar.querySelectorAll('.Lex_Calendario_Navegacion');
        navB[0].addEventListener("click", function () {
            classOb.lessMonth();
        });
        navB[2].addEventListener("click", function () {
            classOb.lessMonth();
        });
        navB[1].addEventListener("click", function () {
            classOb.addMonth();
        });
        navB[3].addEventListener("click", function () {
            classOb.addMonth();
        });
        var navB = classOb.calendar.querySelectorAll('.Lex_Calendario_Select_A');
        navB[0].addEventListener("change", function () {
            classOb.selA1 = this.value;
            classOb.selA2 = this.value;
            classOb.actualizar();
        });
        navB[0].addEventListener("blur", function () {
            setTimeout(function () {
                classOb.blur();
            }, 5);
        });
        var navB = classOb.calendar.querySelectorAll('.Lex_Calendario_Select_M');
        navB[0].addEventListener("change", function () {
            classOb.selM1 = this.value;
            classOb.selM2 = this.value;
            classOb.actualizar();
        });
        navB[0].addEventListener("blur", function () {
            setTimeout(function () {
                classOb.blur();
            }, 5);
        });
        var navB = classOb.calendar.querySelectorAll('td');
        Object.keys(navB).forEach(function (key) {
            navB[key].addEventListener("click", function () {
                classOb.click(this);
            });
            navB[key].addEventListener("mouseover", function () {
                classOb.mouseover(this);
            });
        });
        var navB = classOb.calendar.querySelectorAll('.Lex_Calendario_Hoy');
        if (!classOb.CalendarioConfig.botonHoy) navB[0].style.display = 'none';
        navB[0].addEventListener("click", function () {
            classOb.asignar(_.date(classOb.CalendarioConfig.formato, Math.round(new Date().getTime() / 1000)));
            classOb.calendar.remove();
        });
        var navB = classOb.calendar.querySelectorAll('.Lex_Calendario_Cerrar');
        if (!classOb.CalendarioConfig.botonCerrar) navB[0].style.display = 'none';
        navB[0].addEventListener("click", function () {
            classOb.calendar.remove();
        });

        if (!classOb.CalendarioConfig.botonCerrar && !classOb.CalendarioConfig.botonHoy) {
            var navB = classOb.calendar.querySelectorAll('.Lex_Calendario_Pie');
            navB[0].style.display = 'none';
        }

        var fAct = new Date();
        if (this.Obj instanceof HTMLInputElement) classOb.aDT = classOb.Obj.value; else classOb.aDT = classOb.Obj.innerText;

        if (classOb.aDT != "") {
            try {
                classOb.aDT = _.toUnix(classOb.aDT, classOb.CalendarioConfig.formato);
            } catch (e) { }

            ;
        }

        if (isNaN(classOb.aDT) || classOb.aDT == "") classOb.aDT = Math.round(fAct.getTime() / 1000);
        classOb.selA1 = _.date("Y", classOb.aDT);
        classOb.selA2 = _.date("Y", classOb.aDT);
        classOb.selM1 = _.date("m", classOb.aDT);
        classOb.selM2 = _.date("m", classOb.aDT);
        classOb.selD = _.date("d", classOb.aDT);
        classOb.actualizar();
    });
};

////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
/**
 * funciton para abrir el menu de impresion con html
 * @param {}
 */
_.toPrint = function (html) {
    var prntWindow = window.open("", "PrintWindow", "width=800,height=600,top=50,left=50,toolbars=no,scrollbars=yes,status=no,resizable=yes");
    prntWindow.document.writeln(html);
    prntWindow.document.close();
    prntWindow.focus();
    prntWindow.print();
    prntWindow.close();
};


////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////// ToolTipText //////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
/**
 * Inicia el tooltiptext
 */

_.tooltiptext = function () {
    var TTT = _('.Lexx_ToolTipTextBox');
    if (!TTT) {
        // Crear el contenedor del tooltip
        var TTB = document.createElement("div");
        TTB.classList.add('Lexx_ToolTipTextBox');
        TTB.classList.add('Lexx_ToolTipTextBox_Hide');
        var TTC = document.createElement("div");
        TTC.innerHTML = '<small></small>';
        TTB.appendChild(TTC);

        // Crear una instancia de MutationObserver
        var observer = new MutationObserver(function (mutationsList) {
            // Recorrer todas las mutaciones detectadas
            mutationsList.forEach(function (mutation) {
                // Verificar si el tipo de mutación es la adición de nodos hijos
                if (mutation.type === 'childList') {
                    // Recorrer todos los nodos añadidos en esta mutación
                    mutation.addedNodes.forEach(function (node) {
                        // Procesar el nuevo nodo insertado
                        var cEl = node;
                        _.setToolTipText(cEl.parentElement || cEl.parentNode);
                    });
                }
            });
        });

        // Configurar el observador para observar cambios en el cuerpo del documento
        observer.observe(document.body, { childList: true, subtree: true });

        // Inicializar el tooltiptext para el documento actual
        _.setToolTipText(document);

        // Añadir el contenedor del tooltip al cuerpo del documento
        document.body.appendChild(TTB);
        TTT = _(TTB);
    }
};

_.setToolTipText = function (q) {
    setTimeout(function () {
        var R = q?.querySelectorAll('*');
        if (R) {
            Object.keys(R).forEach(function (key) {
                var cO = R[key];
                if (cO.getAttribute('tooltiptext')) {
                    if (!cO.getAttribute('ttta')) {
                        _(cO).attr('ttta', '1');
                        _(cO).on('mouseover', function () {
                            var TTT = _('.Lexx_ToolTipTextBox');
                            TTT.find('small').html(_(this).attr('tooltiptext'));
                            if (TTT.css('z-index') < _.zIndex()) {
                                TTT.css('z-index', _.zIndex());
                            }
                            var rectO = this.getBoundingClientRect();
                            var rectCal = TTT.Obj[0].getBoundingClientRect();
                            var sumDif = 0;
                            if (rectO.width > rectCal.width) sumDif = (rectO.width - rectCal.width) / 2;
                            var WLeft = rectO.left + sumDif + 0;
                            var WTop = rectO.top - rectCal.height - 10;

                            var sTp = true;
                            var sLft = true;
                            if (WTop - document.documentElement.scrollTop < 0) {
                                WTop = rectO.top + rectO.height + 10;
                                sTp = false;
                            }

                            if (WLeft + rectCal.width + 10 + document.documentElement.scrollLeft > screen.width) {
                                WLeft = rectO.left - rectCal.width - 10;
                                sLft = false;
                            }

                            TTT.Obj[0].style.left = WLeft + 'px';
                            TTT.Obj[0].style.top = WTop + 'px';

                            TTT.removeClass('Lexx_ToolTipTextBox_Hide');
                            TTT.removeClass('Lexx_ToolTipTextBox_Show_LeftTopFP');
                            TTT.removeClass('Lexx_ToolTipTextBox_Show_LeftBottomFP');
                            TTT.removeClass('Lexx_ToolTipTextBox_Show_RightTopFP');
                            TTT.removeClass('Lexx_ToolTipTextBox_Show_RigthBottomFP');
                            if (sLft && sTp) {
                                TTT.addClass('Lexx_ToolTipTextBox_Show_LeftTop');
                                TTT.addClass('Lexx_ToolTipTextBox_Show_LeftTopFP');
                            } else if (sLft && !sTp) {
                                TTT.addClass('Lexx_ToolTipTextBox_Show_LeftBottom');
                                TTT.addClass('Lexx_ToolTipTextBox_Show_LeftBottomFP');
                            } else if (!sLft && sTp) {
                                TTT.addClass('Lexx_ToolTipTextBox_Show_RightTop');
                                TTT.addClass('Lexx_ToolTipTextBox_Show_RightTopFP');
                            } else if (!sLft && !sTp) {
                                TTT.addClass('Lexx_ToolTipTextBox_Show_RightBottom');
                                TTT.addClass('Lexx_ToolTipTextBox_Show_RightBottomFP');
                            }
                        });
                        _(cO).on('mouseout', function () {
                            var TTT = _('.Lexx_ToolTipTextBox');
                            TTT.removeClass('Lexx_ToolTipTextBox_Show_LeftTop');
                            TTT.removeClass('Lexx_ToolTipTextBox_Show_LeftBottom');
                            TTT.removeClass('Lexx_ToolTipTextBox_Show_RightTop');
                            TTT.removeClass('Lexx_ToolTipTextBox_Show_RigthBottom');
                            TTT.addClass('Lexx_ToolTipTextBox_Hide');
                        });
                    }
                }
            });
        }
    }, 1);
};

////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////// AutoComplete //////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
/**
 * Inicia el AutoComplete
 */
_.autocomplete = function (q, _arr, op, pre) {
    if (_(q).attr('lexx_ac')) return;
    if (!op) op = [];
    var _This = [];
    _This['Chars'] = op.chars == undefined ? 1 : op.chars;
    _This['Estricto'] = op.strict == undefined ? false : op.strict;
    _This['Search'] = op.search == undefined ? true : op.search;
    _This['Estado'] = false;
    _This['_Arr'] = _arr;
    _(q).attr('lexx_ac', true);
    _This['Obj'] = _(q); //Asignamos el objeto
    _This['Obj_ID'] = _This['Obj'].attr("ID"); //Obtenemos el ID
    if (!_This['Obj_ID']) { //Si no hay ID, asignamos uno al azar
        _This['Obj_ID'] = _.date("U") + _.rand(1, 50000);
    }
    _This['Obj_ID'] = "AUC_" + _This['Obj_ID']; //Creamos el prefijo para el AutoComplete

    //Creamos el AU seguido del objeto

    _This['AUC'] = document.createElement("div");
    _This['AUC'].classList.add('Lexx_AutoCompleteBox');
    _This['AUC'].classList.add('lexx_hide');
    _This['AUC'] = _(_This['AUC']);
    _This['AUC'].attr('tabindex', 0);
    _This['Obj'].parent().append(_This['AUC']);

    //Asignamos el Focus para abrir el AU
    _This['Obj'].on('focus', function () {
        //Revisamos el array si contiene datos
        if (window[_This['_Arr']]) {
            _This['Estado'] = true;
            if (_.array(window[_This['_Arr']]).len > 0) {
                _This['PreLlenar']('f');

                var ElC = _This['Obj'][0].getBoundingClientRect();
                //_This['AUC'].css('top', (ElC.top + ElC.height) + 'px');
                //_This['AUC'].css('left', ElC.left + 'px');
                _This['AUC'].css('width', ElC.width + 'px');
                _This['AUC'].css('z-index', _.zIndex());
            }
        }
    });

    //Función de Llenar
    _This['PreLlenar'] = function (q) {
        if (!pre) pre = (f) => { f(); };
        return pre(() => {
            if (_.array(window[_This['_Arr']]).len > 0) {
                _This['AUC'].removeClass('lexx_hide');
                var DT = "";
                var TTS = _This['Obj'].val();

                if (TTS.length < _This['Chars']) {
                    _This['AUC'].html(DT);
                    _This['AUC'].addClass('lexx_hide');
                    return false
                };

                _.each(window[_This['_Arr']], function (idx, val) {
                    var R = val.toLowerCase().indexOf(TTS.toLowerCase().trim());
                    if (R > -1 || !_This['Search'])
                        DT += '<div class="lexx_filter_a" idx="' + idx + '">' + val + '</div>';
                });

                if (DT == "") { //Si no hay nada que mostrar, cerramos el contenedor
                    _This['AUC'].html(DT);
                    _This['AUC'].addClass('lexx_hide');
                    return;
                }
                _This['AUC'].html(DT);
                _This['AUC'].removeClass('lexx_hide');

                _This['AUC'].find('div').on('click', function () {
                    _This['Obj'].val(_(this).val());
                    _This['Obj'].attr('idx', _(this).attr('idx'));
                    var evt = new Event("change", { "bubbles": true, "cancelable": false });
                    var choseEvent = new CustomEvent("chose", {
                        detail: {
                            value: _(this).val(),
                            idx: _(this).attr('idx')
                        },
                        bubbles: true,
                        cancelable: true
                    });
                    _This['Obj'][0].dispatchEvent(evt);
                    _This['Obj'][0].dispatchEvent(choseEvent);
                    _This['Cerrar']();
                });
                return true;
            } else
                _This['AUC'].addClass('lexx_hide');
            return false;
        }, q);
    };

    //Función de PreCerrar
    _This['PreCerrar'] = function () {
        //Eliminamos datos y cerramos
        setTimeout(function () {
            if (_This['Obj'][0] !== document.activeElement && _This['AUC'][0] !== document.activeElement) {
                _This['Cerrar']();
                if (_This['Estricto']) {
                    if (_This['Obj'].attr('idx')) {
                        var TX = window[_This['_Arr']][_This['Obj'].attr('idx')];
                        if (_This['Obj'][0] instanceof HTMLInputElement || _This['Obj'][0] instanceof HTMLSelectElement || _This['Obj'][0] instanceof HTMLOptionElement) {
                            _This['Obj'][0].value = TX;
                        } else {
                            _This['Obj'][0].innerHTML = TX;
                        }

                    } else {
                        if (_This['Obj'][0] instanceof HTMLInputElement || _This['Obj'][0] instanceof HTMLSelectElement || _This['Obj'][0] instanceof HTMLOptionElement) {
                            _This['Obj'][0].value = "";
                        } else {
                            _This['Obj'][0].innerHTML = "";
                        }
                    }
                }
            }
        }, 1);
    };

    //Función de Cerrar
    _This['Cerrar'] = function () {
        //Eliminamos datos y cerramos
        _This['Estado'] = false;
        _This['AUC'].addClass('lexx_hide');
        _This['AUC'].html('');
    };

    //Asignamos el Blur para cerrar el AU
    _This['Obj'].on('blur', function () {
        _This['PreCerrar']();
    });

    //Asignamos el Blur para cerrar el AU
    _This['AUC'].on('blur', function () {
        _This['PreCerrar']();
    });

    //Asignamos el keyup para cerrar el AU si precionan escape
    _This['Obj'].on('keyup', function (e) {
        if (!_This['Estado']) return;
        var keyCode = e.keyCode || e.which || e.key;
        if (keyCode == 27) {
            _This['Cerrar']();
        } else {
            setTimeout(function () {
                _This['PreLlenar']('k')
            }, 1);
        }
    });
};


////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////// Sortable //////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
/**
 * Inicia el tipo sortable
 */
_.sortable = function (q, o) {
    var ObjP = _(q);

    if (!ObjP.attr('sorter')) {
        ObjP.attr('sorter', true);
        ObjP.on('DOMNodeInserted', function (e) {
            if (!_.sortable.sortState)
                ObjP.sortable(o);
        });
    }
    var Obj = ObjP.children();
    if (Obj) {
        Obj.each(function (idx) {
            var MDFunc = function () {
                _.sortable.obj = this;
            };
            var MMFunc = function (e) {
                if (_.sortable.mouseState) {
                    var tTm = _.microtime() - _.sortable.Tiempo;
                    if (tTm > 100) {
                        if (this.isEqualNode(_.sortable.obj)) {
                            if (!_.sortable.sortState) {

                                var nEv = new Event("dragStarts");
                                ObjP[0].dispatchEvent(nEv);

                                _.sortable.sortState = true;
                                _.sortable.objM = e;
                                _(this).addClass('sortable_class_active');
                                _.sortable.objDummy = [];
                                _.sortable.objDummy[0] = document.createElement("div");
                                _.sortable.objDummy[1] = document.createElement("div");
                                _.sortable.objDummy[2] = document.createElement("div");
                                _.sortable.objDummy[3] = document.createElement("div");
                                document.body.append(_.sortable.objDummy[0]);
                                document.body.append(_.sortable.objDummy[1]);
                                document.body.append(_.sortable.objDummy[2]);
                                document.body.append(_.sortable.objDummy[3]);
                                _.sortable.objDummy[0] = _(_.sortable.objDummy[0]);
                                _.sortable.objDummy[1] = _(_.sortable.objDummy[1]);
                                _.sortable.objDummy[2] = _(_.sortable.objDummy[2]);
                                _.sortable.objDummy[3] = _(_.sortable.objDummy[3]);

                                var rectO = _.sortable.obj.getBoundingClientRect();

                                _.sortable.objDummy[0].css('width', 1 + 'px').css('height', rectO.height + 'px').css('border', '1px dotted rgb(4, 162, 179)').css('position', 'fixed');
                                _.sortable.objDummy[1].css('width', rectO.width + 'px').css('height', 1 + 'px').css('border', '1px dotted rgb(4, 162, 179)').css('position', 'fixed');
                                _.sortable.objDummy[2].css('width', 1 + 'px').css('height', rectO.height + 'px').css('border', '1px dotted rgb(4, 162, 179)').css('position', 'fixed');
                                _.sortable.objDummy[3].css('width', rectO.width + 'px').css('height', 1 + 'px').css('border', '1px dotted rgb(4, 162, 179)').css('position', 'fixed');
                                Obj.addClass('sortable_class_noselect');
                            }
                        }
                    } else {
                        _.sortable.mouseState = false;
                    }
                }
            };
            var MOFunc = function () {
                if (_.sortable.sortState) {
                    this.parentNode.insertBefore(_.sortable.obj, this.nextSibling);
                }
            };
            Obj[idx].removeEventListener('mousedown', MDFunc);
            Obj[idx].removeEventListener('mousemove', MMFunc);
            Obj[idx].removeEventListener('mouseover', MOFunc);
            Obj[idx].on('mousedown', MDFunc);
            Obj[idx].on('mousemove', MMFunc);
            Obj[idx].on('mouseover', MOFunc);
        });
    }
};
_.sortable.mouseState = false;
_.sortable.sortState = false;
_.sortable.obj = null;
_.sortable.objM = null;
_.sortable.objDummy = null;
_.sortable.Tiempo = 0;
document.addEventListener('mousedown', function () {
    _.sortable.mouseState = true;
    _.sortable.Tiempo = _.microtime();
});
document.addEventListener('mousemove', function (e) {
    if (_.sortable.sortState) {
        var rectO = _.sortable.obj.getBoundingClientRect();
        _.sortable.objDummy[0].css('width', 1 + 'px').css('height', rectO.height + 'px').css('left', (e.x - _.sortable.objM.offsetX) + 'px').css('top', (e.y - _.sortable.objM.offsetY) + 'px');
        _.sortable.objDummy[1].css('width', rectO.width + 'px').css('height', 1 + 'px').css('left', (e.x - _.sortable.objM.offsetX) + 'px').css('top', (e.y - _.sortable.objM.offsetY) + 'px');
        _.sortable.objDummy[2].css('width', 1 + 'px').css('height', rectO.height + 'px').css('left', ((e.x - _.sortable.objM.offsetX) + rectO.width - 2) + 'px').css('top', (e.y - _.sortable.objM.offsetY) + 'px');
        _.sortable.objDummy[3].css('width', rectO.width + 'px').css('height', 1 + 'px').css('left', (e.x - _.sortable.objM.offsetX) + 'px').css('top', ((e.y - _.sortable.objM.offsetY) + rectO.height) + 'px');
    }
});
document.addEventListener('mouseup', function () {
    if (_.sortable.sortState) {
        var nEv = new Event("dragEnds");
        _.sortable.obj.parentNode.dispatchEvent(nEv);
    }
    _.sortable.mouseState = false;
    _.sortable.sortState = false;
    var O = _('.sortable_class_active');
    if (O) O.removeClass('sortable_class_active');
    var O = _('.sortable_class_noselect');
    if (O) O.removeClass('sortable_class_noselect');
    if (_.sortable.objDummy) {
        _.sortable.objDummy[0].remove();
        _.sortable.objDummy[1].remove();
        _.sortable.objDummy[2].remove();
        _.sortable.objDummy[3].remove();
        _.sortable.objDummy = null;
    };
});



////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////// Formulario Editable a Array /////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
/**
 * Inicia la creaciín de los elementos
 */

_.formularioEditable = function (form) {
    var OB = _(form);
    var Res = OB[0].querySelectorAll('*');
    var Data = {};
    _.each(Res, (idx, val) => {
        if (_typeof(val) == 'object')
            if (_(val).attr('contenteditable') || (val instanceof HTMLInputElement || val instanceof HTMLSelectElement || val instanceof HTMLOptionElement)) {
                var ID = _(val).attr('name') ? _(val).attr('name') : _(val).attr('id');
                if (ID)
                    Data[ID] = _(val).val();
            }
    });
    return Data;
};
_.FormData = _.formularioEditable;


////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////// Servicio WSS ////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////

_.wss = function (url) {
    var wss = function wss(url) {
        _classCallCheck(this, wss);

        _defineProperty(this, "onopen", function (f) {
            this.wss.onopen = f;
        });

        _defineProperty(this, "onmessage", function (f) {
            this.wss.onmessage = f;
        });

        _defineProperty(this, "onclose", function (f) {
            this.wss.onclose = f;
        });

        _defineProperty(this, "onerror", function (f) {
            this.wss.onerror = f;
        });

        _defineProperty(this, "send", function (m) {
            this.wss.send(m);
        });

        _defineProperty(this, "close", function () {
            this.wss.close();
        });

        _defineProperty(this, "state", function () {
            if (this.wss.readyState == '0') {
                return "connecting";
            } else if (this.wss.readyState == '1') {
                return "connected";
            } else if (this.wss.readyState == '3') {
                return "disconnected";
            } else {
                return this.wss.readyState;
            }
        });

        this.url = url;
        this.wss = new WebSocket(url, "protocolOne");
    };
    return new wss(url);
};

_.rgbaToHex = function (orig) {
    var a,
        rgb = orig.replace(/\s/g, '').match(/^rgba?\((\d+),(\d+),(\d+),?([^,\s)]+)?/i),
        alpha = (rgb && rgb[4] || "").trim(),
        hex = rgb ?
            (rgb[1] | 1 << 8).toString(16).slice(1) +
            (rgb[2] | 1 << 8).toString(16).slice(1) +
            (rgb[3] | 1 << 8).toString(16).slice(1) : orig;

    if (alpha !== "") {
        a = alpha;
    } else {
        a = '01';
    }

    a = ((a * 255) | 1 << 8).toString(16).slice(1);
    hex = hex + a;
    return '#' + hex;
};

/**
 * Convierte un número formateado como una cadena a su valor numérico original.
 *
 * @param {string} formattedNumber El número formateado como una cadena.
 * @returns {number} El valor numérico original.
 */
_.unformatNumber = function (formattedNumber) {
    // Detecta el separador decimal del usuario.
    const decimalSeparator = (1.1).toLocaleString().substring(1, 2);
    // Reemplaza todos los separadores de miles.
    let number = 0;
    //Si el decimal es . quiere decir q el de miles es ,
    if (decimalSeparator == ',')
        number = formattedNumber.replaceAll('.', '');
    else if (decimalSeparator == '.')
        number = formattedNumber.replaceAll(',', '');

    // Si el separador decimal no es un punto, cambia el separador decimal a un punto.
    if (decimalSeparator !== '.') {
        number = number.replace(decimalSeparator, '.');
    }

    // Convierte la cadena a un número y devuelve el resultado.
    return parseFloat(number);
};

_.url = {};
_.url.get = function (q) {
    // Primero, obtén la URL completa
    const url = window.location.href;

    // Luego, crea un objeto URL a partir de la URL actual
    const urlObj = new URL(url);

    // Ahora, utiliza URLSearchParams para trabajar con los parámetros de consulta
    const params = new URLSearchParams(urlObj.search);

    // Finalmente, obtén el valor del parámetro 'ref'
    return params.get(q);
};

////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////// Placeholder Visibles ////////////////////
////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////

(function () {
    function attachPlaceholderFix(el) {
        el.addEventListener('input', function () {
            const clean = el.innerHTML.replace(/<br\s*\/?>|&nbsp;|\s+/gi, '').trim();
            if (clean === '') el.innerHTML = '';
        });

        // Limpieza inicial por si ya vino con <br>
        const initial = el.innerHTML.replace(/<br\s*\/?>|&nbsp;|\s+/gi, '').trim();
        if (initial === '') el.innerHTML = '';
    }

    // Observa nuevos elementos que se añadan al DOM
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (!(node instanceof HTMLElement)) return;

                if (node.matches?.('.Lexx_Global_Editable_Contenido')) {
                    attachPlaceholderFix(node);
                }

                node.querySelectorAll?.('.Lexx_Global_Editable_Contenido').forEach(el => {
                    attachPlaceholderFix(el);
                });
            });
        });
    });
    try {
        observer.observe(document.body, { childList: true, subtree: true });
    } catch (e) { }
})();


//Informamos por consola la carga de la librería
console.log("Lexx Lib Loaded.");