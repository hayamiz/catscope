require "bundler/gem_tasks"

task :assets do
  Dir.chdir("assets") do
    sh "bundle exec compass compile"
  end
end

