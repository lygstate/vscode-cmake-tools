import { expect } from 'chai';
import { EnvironmentVariablesUtils } from '@cmt/environmentVariables';

suite('[Environment]', async () => {
    test('Environment variable to `preserve/non-preserve null` `win/non-win`', () => {
        const envA = {
            A: 'x',
            B: null
        };
        const envB = {
            a: 'T',
            u: 'BBQ'
        };
        const resultA = EnvironmentVariablesUtils.mergeImpl(false, false, envA, undefined, envB);
        expect(resultA).to.deep.equal({A: 'x', a: 'T', u: 'BBQ'});
        const resultB = EnvironmentVariablesUtils.mergeImpl(true, false, envA, undefined, envB);
        expect(resultB).to.deep.equal({A: 'x', B: null, a: 'T', u: 'BBQ'});
        const resultC = EnvironmentVariablesUtils.mergeImpl(false, true, envA, undefined, envB);
        expect(resultC).to.deep.equal({A: 'T', u: 'BBQ'});
        const resultD = EnvironmentVariablesUtils.mergeImpl(true, true, envA, undefined, envB);
        expect(resultD).to.deep.equal({A: 'T', B: null, u: 'BBQ'});

        const m = new Map<string, string>();
        m.set('DD', 'FF');
        m.set('dd', 'FE');
        const resultE = EnvironmentVariablesUtils.create(m, false, false);
        expect(resultE).to.deep.equal({DD: 'FF', dd: 'FE'});
        const resultF = EnvironmentVariablesUtils.create(m, false, true);
        expect(resultF).to.deep.equal({DD: 'FE'});
        expect(resultF['dd']).to.equal('FE');

        /* Testing win32 case-insensitive environment variable */
        expect(Object.prototype.hasOwnProperty.call(resultF, 'dD')).to.equal(true);
        expect(Object.prototype.hasOwnProperty.call(resultF, 'Dd')).to.equal(true);
        expect(Object.prototype.hasOwnProperty.call(resultF, 'DD-non-exist-key')).to.equal(false);
        expect(Object.keys(resultF).sort()).to.deep.equal(["DD"]);
        expect(resultF['DD-NON-EXIST-key']).to.equal(undefined);
        expect(Object.keys(resultF).sort()).to.deep.equal(["DD"]);
        resultF['DD-NON-EXIST-KEY'] = 'bb';
        expect(resultF['DD-NON-EXIST-KEY']).to.equal('bb');
        expect(Object.keys(resultF).sort()).to.deep.equal(["DD", "DD-NON-EXIST-KEY"]);
        resultF['DD-NON-EXIST-key'] = 'cc';
        expect(resultF['DD-NON-EXIST-KEY']).to.equal('cc');
        expect(Object.keys(resultF).sort()).to.deep.equal(["DD", "DD-NON-EXIST-KEY"]);

        const localeOverrideA = EnvironmentVariablesUtils.create({
            LANG: "C",
            LC_ALL: "C",
            lc_all: "C"
        }, false, false);
        expect(localeOverrideA).to.deep.equal({LANG: 'C', LC_ALL: 'C', lc_all: "C"});

        const localeOverrideB = EnvironmentVariablesUtils.create({
            LANG: "C",
            LC_ALL: "C",
            lc_all: "GBK"
        }, false, true);
        expect(localeOverrideB).to.deep.equal({LANG: 'C', LC_ALL: 'GBK'});
    });
});
