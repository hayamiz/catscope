# coding: utf-8
lib = File.expand_path('../lib', __FILE__)
$LOAD_PATH.unshift(lib) unless $LOAD_PATH.include?(lib)
require 'dorv/version'

Gem::Specification.new do |spec|
  spec.name          = "dorv"
  spec.version       = Dorv::VERSION
  spec.authors       = ["Yuto Hayamizu"]
  spec.email         = ["y.hayamizu@gmail.com"]
  spec.summary       = "On-demand web-based file browser"
  spec.description   = "Dorv is an on-demand web-based file browser."
  spec.homepage      = "http://github.com/hayamiz/dorv/"
  spec.license       = "MIT"

  spec.files         = `git ls-files -z`.split("\x0")
  spec.executables   = spec.files.grep(%r{^bin/}) { |f| File.basename(f) }
  spec.test_files    = spec.files.grep(%r{^(test|spec|features)/})
  spec.require_paths = ["lib"]

  spec.add_development_dependency "bundler", "~> 1.7"
  spec.add_development_dependency "rake", "~> 10.0"
end
