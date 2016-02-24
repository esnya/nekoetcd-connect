require 'spec_helper'

describe service('node') do
  it { should be_running }
end