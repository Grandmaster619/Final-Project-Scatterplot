# Final Project with D3
This is an example of a running webpage with a d3 visualization using data from our postgres database. Use it to examine the way d3 is connected to the data and piped into the visualization. 

This can be very messy and challenging. Use an AI if you get stuck and to help you find errors in your code. 

Remember the tools you've learned about with python and frontend:
* Browser developers tools
* Python inspect and pprint to check if your data is returning from the db.
* Logger! I always use a logger. Don't use print statements. You are not an amateur. A logger can give you the line number and function of your application failure. This is especially important because a print statement will not show errors from underlying libraries, but the logger will! That is not common but it happens.
* Use try...except around any method that is failing so that you can use a logger to print the error and see where the exception is happening. Do you debug the database, the frontend, or the bottle?