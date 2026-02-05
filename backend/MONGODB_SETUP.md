# Felicity EMS - MongoDB Atlas Setup

## Step 1: Create MongoDB Atlas Account
1. Go to https://www.mongodb.com/cloud/atlas/register
2. Sign up for a free account or log in

## Step 2: Create a Free Cluster
1. Click "Build a Database"
2. Choose the FREE "Shared" tier (M0)
3. Select a cloud provider and region (closest to your location)
4. Name your cluster (e.g., "felicity-cluster")
5. Click "Create"

## Step 3: Set Up Database Access
1. Go to "Database Access" in the left sidebar
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Set username (e.g., "felicity_admin")
5. Auto-generate or set a secure password
6. Save the credentials securely
7. Set privileges to "Read and write to any database"
8. Click "Add User"

## Step 4: Set Up Network Access
1. Go to "Network Access" in the left sidebar
2. Click "Add IP Address"
3. For development: Click "Allow Access from Anywhere" (0.0.0.0/0)
   - For production: Add specific IP addresses
4. Click "Confirm"

## Step 5: Get Connection String
1. Go to "Database" in the left sidebar
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Select "Node.js" as driver and version
5. Copy the connection string
6. Replace `<password>` with your database user password
7. Replace `<database>` with "felicity-ems"

## Step 6: Update .env File
Replace the MONGO_URI in your `.env` file with your connection string:

```
MONGO_URI=mongodb+srv://felicity_admin:<your-password>@cluster.mongodb.net/felicity-ems?retryWrites=true&w=majority
```

**Note:** Keep your connection string secure and never commit it to Git!
