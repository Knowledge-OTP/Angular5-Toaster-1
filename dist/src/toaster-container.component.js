import { Component, Input, ChangeDetectorRef, NgZone } from '@angular/core';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { ToasterConfig } from './toaster-config';
import { ToasterService } from './toaster.service';
var ToasterContainerComponent = (function () {
    function ToasterContainerComponent(toasterService, ref, ngZone) {
        this.ref = ref;
        this.ngZone = ngZone;
        this.toasts = [];
        this.toasterService = toasterService;
    }
    ToasterContainerComponent.prototype.ngOnInit = function () {
        this.registerSubscribers();
        if (this.toasterconfig === null || typeof this.toasterconfig === 'undefined') {
            this.toasterconfig = new ToasterConfig();
        }
    };
    // event handlers
    // event handlers
    ToasterContainerComponent.prototype.click = 
    // event handlers
    function (toast, isCloseButton) {
        if (this.toasterconfig.tapToDismiss || (toast.showCloseButton && isCloseButton)) {
            var removeToast = true;
            if (toast.clickHandler) {
                if (typeof toast.clickHandler === 'function') {
                    removeToast = toast.clickHandler(toast, isCloseButton);
                }
                else {
                    console.log('The toast click handler is not a callable function.');
                    return false;
                }
            }
            if (removeToast) {
                this.removeToast(toast);
            }
        }
    };
    ToasterContainerComponent.prototype.childClick = function ($event) {
        this.click($event.value.toast, $event.value.isCloseButton);
    };
    ToasterContainerComponent.prototype.stopTimer = function (toast) {
        if (this.toasterconfig.mouseoverTimerStop) {
            if (toast.timeoutId) {
                window.clearTimeout(toast.timeoutId);
                toast.timeoutId = null;
            }
        }
    };
    ToasterContainerComponent.prototype.restartTimer = function (toast) {
        if (this.toasterconfig.mouseoverTimerStop) {
            if (!toast.timeoutId) {
                this.configureTimer(toast);
            }
        }
        else if (toast.timeoutId === null) {
            this.removeToast(toast);
        }
    };
    // private functions
    // private functions
    ToasterContainerComponent.prototype.registerSubscribers = 
    // private functions
    function () {
        var _this = this;
        this.addToastSubscriber = this.toasterService.addToast.subscribe(function (toast) {
            _this.addToast(toast);
        });
        this.clearToastsSubscriber = this.toasterService.clearToasts.subscribe(function (clearWrapper) {
            _this.clearToasts(clearWrapper);
        });
    };
    ToasterContainerComponent.prototype.addToast = function (toast) {
        toast.toasterConfig = this.toasterconfig;
        if (toast.toastContainerId && this.toasterconfig.toastContainerId
            && toast.toastContainerId !== this.toasterconfig.toastContainerId) {
            return;
        }
        if (!toast.type) {
            toast.type = this.toasterconfig.defaultTypeClass;
        }
        if (this.toasterconfig.preventDuplicates && this.toasts.length > 0) {
            if (toast.toastId && this.toasts.some(function (t) { return t.toastId === toast.toastId; })) {
                return;
            }
            else if (this.toasts.some(function (t) { return t.body === toast.body; })) {
                return;
            }
        }
        if (toast.showCloseButton === null || typeof toast.showCloseButton === 'undefined') {
            if (typeof this.toasterconfig.showCloseButton === 'object') {
                toast.showCloseButton = this.toasterconfig.showCloseButton[toast.type];
            }
            else if (typeof this.toasterconfig.showCloseButton === 'boolean') {
                toast.showCloseButton = this.toasterconfig.showCloseButton;
            }
        }
        if (toast.showCloseButton) {
            toast.closeHtml = toast.closeHtml || this.toasterconfig.closeHtml;
        }
        toast.bodyOutputType = toast.bodyOutputType || this.toasterconfig.bodyOutputType;
        this.configureTimer(toast);
        if (this.toasterconfig.newestOnTop) {
            this.toasts.unshift(toast);
            if (this.isLimitExceeded()) {
                this.toasts.pop();
            }
        }
        else {
            this.toasts.push(toast);
            if (this.isLimitExceeded()) {
                this.toasts.shift();
            }
        }
        if (toast.onShowCallback) {
            toast.onShowCallback(toast);
        }
    };
    ToasterContainerComponent.prototype.configureTimer = function (toast) {
        var _this = this;
        var timeout = (typeof toast.timeout === 'number')
            ? toast.timeout : this.toasterconfig.timeout;
        if (typeof timeout === 'object') {
            timeout = timeout[toast.type];
        }
        if (timeout > 0) {
            this.ngZone.runOutsideAngular(function () {
                toast.timeoutId = window.setTimeout(function () {
                    _this.ngZone.run(function () {
                        _this.ref.markForCheck();
                        _this.removeToast(toast);
                    });
                }, timeout);
            });
        }
    };
    ToasterContainerComponent.prototype.isLimitExceeded = function () {
        return this.toasterconfig.limit && this.toasts.length > this.toasterconfig.limit;
    };
    ToasterContainerComponent.prototype.removeToast = function (toast) {
        var index = this.toasts.indexOf(toast);
        if (index < 0) {
            return;
        }
        this.toasts.splice(index, 1);
        if (toast.timeoutId) {
            window.clearTimeout(toast.timeoutId);
            toast.timeoutId = null;
        }
        if (toast.onHideCallback) {
            toast.onHideCallback(toast);
        }
        this.toasterService._removeToastSubject.next({
            toastId: toast.toastId,
            toastContainerId: toast.toastContainerId
        });
    };
    ToasterContainerComponent.prototype.removeAllToasts = function () {
        for (var i = this.toasts.length - 1; i >= 0; i--) {
            this.removeToast(this.toasts[i]);
        }
    };
    ToasterContainerComponent.prototype.clearToasts = function (clearWrapper) {
        var toastId = clearWrapper.toastId;
        var toastContainerId = clearWrapper.toastContainerId;
        if (toastContainerId === null || typeof toastContainerId === 'undefined') {
            this.clearToastsAction(toastId);
        }
        else if (toastContainerId === this.toasterconfig.toastContainerId) {
            this.clearToastsAction(toastId);
        }
    };
    ToasterContainerComponent.prototype.clearToastsAction = function (toastId) {
        if (toastId) {
            this.removeToast(this.toasts.filter(function (t) { return t.toastId === toastId; })[0]);
        }
        else {
            this.removeAllToasts();
        }
    };
    ToasterContainerComponent.prototype.ngOnDestroy = function () {
        if (this.addToastSubscriber) {
            this.addToastSubscriber.unsubscribe();
        }
        if (this.clearToastsSubscriber) {
            this.clearToastsSubscriber.unsubscribe();
        }
    };
    ToasterContainerComponent.decorators = [
        { type: Component, args: [{
                    selector: 'toaster-container',
                    template: "\n        <div id=\"toast-container\" [ngClass]=\"[toasterconfig.positionClass]\">\n            <div toastComp *ngFor=\"let toast of toasts\" class=\"toast\" [toast]=\"toast\"\n                 [@toastState]=\"toasterconfig.animation\"\n                 [iconClass]=\"toasterconfig.iconClasses[toast.type]\"\n                 [ngClass]=\"toasterconfig.typeClasses[toast.type]\"\n                 (click)=\"click(toast)\" (clickEvent)=\"childClick($event)\"\n                 (mouseover)=\"stopTimer(toast)\" (mouseout)=\"restartTimer(toast)\">\n            </div>\n        </div>\n    ",
                    // TODO: use styleUrls once Angular 2 supports the use of relative paths
                    // https://github.com/angular/angular/issues/2383
                    // styleUrls: ['./toaster.css']
                    animations: [
                        trigger('toastState', [
                            state('flyRight, flyLeft, slideDown, slideUp, fade', style({ opacity: 1, transform: 'translate(0,0)' })),
                            transition('void => flyRight', [
                                style({
                                    opacity: 0, transform: 'translateX(100%)'
                                }),
                                animate('0.25s ease-in')
                            ]),
                            transition('flyRight => void', [
                                animate('0.25s 10ms ease-out', style({
                                    opacity: 0, transform: 'translateX(100%)'
                                }))
                            ]),
                            transition('void => flyLeft', [
                                style({
                                    opacity: 0, transform: 'translateX(-100%)'
                                }),
                                animate('0.25s ease-in')
                            ]),
                            transition('flyLeft => void', [
                                animate('0.25s 10ms ease-out', style({
                                    opacity: 0, transform: 'translateX(-100%)'
                                }))
                            ]),
                            transition('void => slideDown', [
                                style({
                                    opacity: 0, transform: 'translateY(-200%)'
                                }),
                                animate('0.3s ease-in')
                            ]),
                            transition('slideDown => void', [
                                animate('0.3s 10ms ease-out', style({
                                    opacity: 0, transform: 'translateY(200%)'
                                }))
                            ]),
                            transition('void => slideUp', [
                                style({
                                    opacity: 0, transform: 'translateY(200%)'
                                }),
                                animate('0.3s ease-in')
                            ]),
                            transition('slideUp => void', [
                                animate('0.3s 10ms ease-out', style({
                                    opacity: 0, transform: 'translateY(-200%)'
                                }))
                            ]),
                            transition('void => fade', [
                                style({
                                    opacity: 0,
                                }),
                                animate('0.3s ease-in')
                            ]),
                            transition('fade => void', [
                                animate('0.3s 10ms ease-out', style({
                                    opacity: 0,
                                }))
                            ])
                        ]),
                    ]
                },] },
    ];
    /** @nocollapse */
    ToasterContainerComponent.ctorParameters = function () { return [
        { type: ToasterService, },
        { type: ChangeDetectorRef, },
        { type: NgZone, },
    ]; };
    ToasterContainerComponent.propDecorators = {
        "toasterconfig": [{ type: Input },],
    };
    return ToasterContainerComponent;
}());
export { ToasterContainerComponent };
//# sourceMappingURL=toaster-container.component.js.map