"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
const chai_1 = require("chai");
const path = require("path");
describe('stop', () => __awaiter(this, void 0, void 0, function* () {
    let dc;
    beforeEach(() => __awaiter(this, void 0, void 0, function* () {
        dc = yield utils_1.standardBeforeEach();
    }));
    afterEach(() => __awaiter(this, void 0, void 0, function* () {
        yield dc.stop();
    }));
    it('handles segv', () => __awaiter(this, void 0, void 0, function* () {
        yield dc.launchRequest({
            verbose: true,
            gdb: utils_1.gdbPath,
            program: path.join(utils_1.testProgramsDir, 'segv'),
            openGdbConsole: utils_1.openGdbConsole,
        });
        yield dc.configurationDoneRequest();
        const stoppedEvent = yield dc.waitForEvent('stopped');
        chai_1.expect(stoppedEvent.body.reason).to.eq('SIGSEGV');
    }));
}));
//# sourceMappingURL=stop.spec.js.map