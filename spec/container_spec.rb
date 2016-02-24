require 'spec_helper'

describe service('node') do
    it { should be_running }
end

describe command('docker exec ${ETCD_CONTAINER_ID} /etcdctl get ${APP_NAME}') do
    it { should eq `docker inspect --format="{{.NetworkSettings.IPAddress}}" ${APP_NAME}` }
end
