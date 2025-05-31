#!/bin/bash

# --- Configuration ---
# Path to your SSH private key
KEY_PATH="~/code_base/sriahobilamath.pem"
# Remote user for SSH connection (e.g., ec2-user, ubuntu, admin)
REMOTE_USER="ec2-user"
# Public IP or hostname of your EC2 instance
REMOTE_HOST="ec2-13-201-14-181.ap-south-1.compute.amazonaws.com"
# Name of the zip file to transfer
ZIP_FILE="src_fe.zip"
# Remote directory where the zip file will be transferred and unzipped
REMOTE_APP_DIR="/home/${REMOTE_USER}/sriahobilamath"
# Path to the built Angular application relative to REMOTE_APP_DIR after unzip and build
ANGULAR_DIST_PATH="${REMOTE_APP_DIR}/dist/event-registration"
# Nginx web root directory on the remote server
NGINX_WEB_ROOT="/usr/share/nginx/html"

# --- Script Execution ---

echo "--- Starting Deployment Script ---"
echo "Target EC2 Instance: ${REMOTE_USER}@${REMOTE_HOST}"
echo "Using SSH Key: ${KEY_PATH}"

# 1. SCP: Transfer the zip file to the EC2 instance
echo -e "\n--- Step 1: Transferring ${ZIP_FILE} to ${REMOTE_HOST}:${REMOTE_APP_DIR} ---"
scp -i "$KEY_PATH" "$ZIP_FILE" "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_APP_DIR}/"
if [ $? -ne 0 ]; then
    echo "Error: SCP failed. Exiting."
    exit 1
fi
echo "File transferred successfully."

# 2. SSH: Connect and execute commands on the remote node
echo -e "\n--- Step 2: Executing commands on ${REMOTE_HOST} ---"
ssh -i "$KEY_PATH" "$REMOTE_USER@$REMOTE_HOST" << EOF
    # Ensure we are in the correct directory
    echo "Navigating to ${REMOTE_APP_DIR}..."
    cd "${REMOTE_APP_DIR}"
    if [ $? -ne 0 ]; then
        echo "Error: Could not change directory to ${REMOTE_APP_DIR}. Exiting remote commands."
        exit 1
    fi

    # 3. Unzip the file
    echo "Unzipping ${ZIP_FILE}..."
    unzip -o "${ZIP_FILE}"
    if [ $? -ne 0 ]; then
        echo "Error: Unzipping failed. Exiting remote commands."
        exit 1
    fi
    echo "Unzip complete."

    # 4. Build the Angular project
    echo "Building Angular project for production..."
    npm install # Ensure dependencies are installed before building
    if [ $? -ne 0 ]; then
        echo "Warning: npm install failed. Continuing, but build might fail."
    fi
    ng build --configuration=production
    if [ $? -ne 0 ]; then
        echo "Error: Angular build failed. Exiting remote commands."
        exit 1
    fi
    echo "Angular build complete."

    # 5. Remove existing Nginx content
    echo "Clearing Nginx web root: ${NGINX_WEB_ROOT}..."
    sudo rm -rf "${NGINX_WEB_ROOT}/*"
    if [ $? -ne 0 ]; then
        echo "Error: Failed to clear Nginx web root. Check sudo permissions. Exiting remote commands."
        exit 1
    fi
    echo "Nginx web root cleared."

    # 6. Copy new build to Nginx web root
    echo "Copying new build from ${ANGULAR_DIST_PATH} to ${NGINX_WEB_ROOT}..."
    sudo cp -r "${ANGULAR_DIST_PATH}/." "${NGINX_WEB_ROOT}/"
    if [ $? -ne 0 ]; then
        echo "Error: Failed to copy new build to Nginx web root. Check sudo permissions. Exiting remote commands."
        exit 1
    fi
    echo "New build copied."

    # 7. Restart Nginx service
    echo "Restarting Nginx service..."
    sudo systemctl restart nginx
    if [ $? -ne 0 ]; then
        echo "Error: Failed to restart Nginx service. Check sudo permissions. Exiting remote commands."
        exit 1
    fi
    echo "Nginx restarted successfully."
EOF

# Check the exit status of the SSH command
if [ $? -ne 0 ]; then
    echo "Error: SSH command execution failed on remote host. See above for details."
    exit 1
fi

echo -e "\n--- Deployment Script Finished Successfully! ---"
echo "Your application should now be updated and accessible."
