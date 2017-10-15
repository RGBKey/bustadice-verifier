const router = new VueRouter();

let app = new Vue({
    router,
    el: '#app',
    data: {
        serverSeed: '',
        serverSeedHash: '',
        clientSeed: '',
        nonce: 1
    },
    created: function() {
        this.serverSeed = this.$route.query.server_seed || '';
        this.serverSeedHash = this.$route.query.server_seed_hash || '';
        this.clientSeed = this.$route.query.client_seed || '';
        this.nonce = this.$route.query.nonce || 1;
    },
    methods: {
        hmacsha256: function(key, value) {
            let hash = forge.hmac.create();
            hash.start('sha256', key);
            hash.update(value);
            return hash.digest().toHex();
        },
        sha256: function(K) {
            let md = forge.md.sha256.create();
            md.update(K);
            return md.digest().toHex();
        },
        allInfoPresent: function() {
            return this.splitSeeds(this.serverSeed)
                && this.serverSeedHash === this.hashServerSeed(this.splitSeeds(this.serverSeed))
                && !isNaN(this.nonce)
                && this.nonce >= 1;
        },
        splitSeeds: function(seed) {
            const seeds = seed.split('_');
            if(seeds.length === 2 && seeds[0].length === 64 && seeds[1].length === 64) {
                return seeds;
            } else {
                return false;
            }
        },
        hashServerSeed: function(seeds) {
            let [ auditSeed, gameSeed ] = seeds;
            const auditSeedHash = this.sha256(auditSeed);
            const serverSeedHash = this.hmacsha256(gameSeed, auditSeedHash);
            return serverSeedHash;
        },
        calculateGame: function(gameSeed, clientSeed, nonce, auditSeed) {
            let hash = this.hmacsha256(`${gameSeed}|${clientSeed}|${nonce}`, auditSeed);
            hash = hash.substr(0, 52/4);
            const X = parseInt(hash, 16) / Math.pow(2, 52);
            const multiplier = Math.floor(99 / (1 - X));
            return Math.max(100, Math.min(multiplier, 100000000));
        },
        result: function() {
            const seeds = this.splitSeeds(this.serverSeed);
            let [ auditSeed, gameSeed ] = seeds;
            const wagerHash = this.hmacsha256(auditSeed, this.nonce.toString());
            const result = (this.calculateGame(gameSeed, this.clientSeed, this.nonce, wagerHash) / 100).toFixed(2) + 'x';
            return result;
        }
    }
});
