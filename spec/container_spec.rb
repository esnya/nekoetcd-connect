require 'spec_helper'

describe command('docker ps | grep %s' % [ENV['TARGET_CONTAINER_ID']]) do
    its(:exit_status) { should eq 0 }
    its(:stderr) { should eq '' }
end

describe command('docker exec %s /etcdctl get backends/%s' % [ENV['ETCD_CONTAINER_ID'], ENV['APP_NAME']]) do
    its(:exit_status) { should eq 0 }
    its(:stdout) { should eq 'http://' + `docker inspect --format="{{.NetworkSettings.IPAddress}}" ${APP_CONTAINER_ID}` }
    its(:stderr) { should eq '' }
end
