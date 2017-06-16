pipeline {
  agent any
  stages {
    stage('Build') {
      steps {
        bat 'npm install'
        bat 'node run build-windows'
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