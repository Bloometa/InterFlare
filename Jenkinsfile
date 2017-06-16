pipeline {
  agent any
  stages {
    stage('Build') {
      steps {
        bat 'npm install'
        bat 'npm run build-windows'
      }
    }
    stage('Deploy') {
      steps {
        archiveArtifacts 'dist/**/*'
        cleanWs()
      }
    }
  }
}