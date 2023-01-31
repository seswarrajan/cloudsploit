var async = require('async');

var helpers = require('../../../helpers/azure/');

module.exports = {
    title: 'Disk Volumes Unattached and Default Encryption',
    category: 'Virtual Machines',
    domain: 'Compute',
    description: 'Ensures that no default encrypted Azure virtual machine disks are in unattached state.',
    more_info: 'Encrypting virtual machine disk volumes helps protect and safeguard your data to meet organizational security and compliance commitments.When a virtual machine (VM) in Azure is deleted, by default, any disks that are attached to the VM aren\'t deleted.',
    recommended_action: 'Modify disks change encryption type and change disk state',
    link: 'https://docs.microsoft.com/en-us/azure/virtual-machines/windows/disk-encryption-key-vault',
    apis: ['disks:list'],

    run: function(cache, settings, callback) {
        var results = [];
        var source = {};
        var locations = helpers.locations(settings.govcloud);

        async.each(locations.disks, function(location, rcb) {

            var disks = helpers.addSource(cache, source, ['disks', 'list', location]);

            if (!disks) return rcb();

            if (disks.err || !disks.data) {
                helpers.addResult(results, 3, 'Unable to query for virtual machine disk volumes: ' + helpers.addError(disks), location);
                return rcb();
            }
            if (!disks.data.length) {
                helpers.addResult(results, 0, 'No existing disk volumes found', location);
                return rcb();
            }

            for (let disk of disks.data) {
                if (!disk.id) continue;

                if (disk.encryption && disk.encryption.type &&
                    disk.encryption.type === 'EncryptionAtRestWithPlatformKey' &&
                    disk.diskState && disk.diskState.toLowerCase() === 'unattached') {
                    helpers.addResult(results, 0, 'Disk volume is unattached and encrypted with default encryption key', location, disk.id);
                } else {
                    helpers.addResult(results, 2, 'Disk volume is not unattached and encrypted with default encryption key', location, disk.id);
                }
            }
            rcb();
        }, function() {
            callback(null, results, source);
        });
    }
};