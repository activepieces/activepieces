# Check if both piece name and type are provided
if [ -z "$1" ] || [ -z "$2" ]; then
    echo "Please provide both a piece name and a type (c/community or cc/custom)."
    exit 1
fi

# Check if the type is either 'c'/'community' or 'cc'/'custom'
if [ "$1" = "c" ] || [ "$1" = "community" ]; then
    type="community"
elif [ "$1" = "cc" ] || [ "$1" = "custom" ]; then
    type="custom"
else
    echo "Invalid type. Please use 'c/community' or 'cc/custom'."
    exit 1
fi

# Run the build command with the provided piece name and type
nx build pieces-$type-$2

